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
      subscription: {
        include: {
          service_provider: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
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

  async uploadProof(user: AuthUser, billingId: string, file?: Express.Multer.File) {
    this.assertFile(file);

    const billing = await this.prisma.billing.findUnique({
      where: { id: billingId },
      include: { subscription: true, payment: true },
    });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    if (billing.subscription.user_id !== user.id) {
      throw new ForbiddenException(
        'Anda hanya dapat membayar tagihan milik sendiri',
      );
    }
    if (billing.status === BillingStatus.PAID) {
      throw new ConflictException(
        'Tagihan yang sudah lunas tidak dapat dibayar ulang',
      );
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

  findAll(user: AuthUser, status?: PaymentStatus) {
    return this.prisma.payment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(user.role === Role.ADMIN
          ? {}
          : { billing: { subscription: { user_id: user.id } } }),
      },
      include: paymentInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }
    if (
      user.role !== Role.ADMIN &&
      payment.billing.subscription.user_id !== user.id
    ) {
      throw new ForbiddenException('Anda tidak dapat mengakses pembayaran ini');
    }
    return payment;
  }

  async verify(admin: AuthUser, id: string, action: 'APPROVE' | 'REJECT') {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException(
        'Hanya pembayaran PENDING yang dapat diverifikasi',
      );
    }

    const approved = action === 'APPROVE';

    return this.prisma.$transaction(async (tx) => {
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
  }

  private assertFile(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
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
