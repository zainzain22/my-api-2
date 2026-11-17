import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { FileStorageService } from '../file-storage/file-storage.service.js';
import {
  BillingStatus,
  PaymentStatus,
  Role,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const paymentInclude = {
  billing: {
    include: {
      electricity_account: true,
    },
  },
  verifier: {
    select: { id: true, name: true, email: true, role: true },
  },
} as const;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FileStorageService,
  ) {}

  async uploadProof(user: AuthUser, billingId: number, file?: Express.Multer.File) {
    this.assertFile(file);

    const billing = await this.prisma.billing.findUnique({
      where: { id: billingId },
      include: { electricity_account: true, payment: true },
    });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    if (billing.electricity_account.user_id !== user.id) {
      throw new ForbiddenException('Anda hanya dapat membayar tagihan milik sendiri');
    }
    if (billing.status === BillingStatus.PAID) {
      throw new ConflictException('Tagihan yang sudah lunas tidak dapat dibayar ulang');
    }
    if (billing.status !== BillingStatus.UNPAID) {
      throw new ConflictException(
        'Bukti pembayaran hanya dapat diunggah untuk tagihan berstatus UNPAID',
      );
    }

    const path = await this.files.savePaymentProof(file);

    const payment = billing.payment
      ? await this.prisma.payment.update({
          where: { id: billing.payment.id },
          data: {
            payment_proof: path,
            status: PaymentStatus.PENDING,
            verified_by: null,
            verified_at: null,
          },
          include: paymentInclude,
        })
      : await this.prisma.payment.create({
          data: {
            billing_id: billing.id,
            payment_proof: path,
            status: PaymentStatus.PENDING,
          },
          include: paymentInclude,
        });

    await this.prisma.billing.update({
      where: { id: billing.id },
      data: { status: BillingStatus.WAITING_VERIFICATION },
    });

    return payment;
  }

  findAll(user: AuthUser) {
    return this.prisma.payment.findMany({
      where:
        user.role === Role.ADMIN
          ? undefined
          : { billing: { electricity_account: { user_id: user.id } } },
      include: paymentInclude,
      orderBy: { id: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }
    if (
      user.role !== Role.ADMIN &&
      payment.billing.electricity_account.user_id !== user.id
    ) {
      throw new ForbiddenException('Anda tidak dapat mengakses pembayaran ini');
    }
    return payment;
  }

  async verify(admin: AuthUser, id: number, action: 'APPROVE' | 'REJECT') {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Hanya pembayaran PENDING yang dapat diverifikasi');
    }

    const approved = action === 'APPROVE';

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.payment.update({
        where: { id },
        data: {
          status: approved ? PaymentStatus.APPROVED : PaymentStatus.REJECTED,
          verified_by: admin.id,
          verified_at: new Date(),
        },
        include: paymentInclude,
      });

      await tx.billing.update({
        where: { id: payment.billing_id },
        data: {
          status: approved ? BillingStatus.PAID : BillingStatus.UNPAID,
        },
      });

      return result;
    });

    return updated;
  }

  private assertFile(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File bukti pembayaran wajib diunggah');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Tipe file tidak didukung. Gunakan JPEG, PNG, WEBP, atau PDF',
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Ukuran file maksimal 2MB');
    }
  }
}
