import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import {
  BillingStatus,
  Prisma,
  Role,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBillingDto } from './dto/create-billing.dto.js';
import { UpdateBillingDto } from './dto/update-billing.dto.js';

const billingInclude = {
  subscription: {
    include: {
      service_provider: true,
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  },
  payment: true,
} as const;

@Injectable()
export class BillingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBillingDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscription_id },
      include: { service_provider: true },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription tidak ditemukan');
    }

    const amount =
      dto.amount ?? Number(subscription.service_provider.price_per_month);

    try {
      return await this.prisma.billing.create({
        data: {
          subscription_id: dto.subscription_id,
          period_month: dto.period_month,
          period_year: dto.period_year,
          amount,
          due_date: new Date(dto.due_date),
          status: BillingStatus.UNPAID,
        },
        include: billingInclude,
      });
    } catch (error) {
      this.handlePeriodUnique(error);
      throw error;
    }
  }

  findAll(user: AuthUser) {
    return this.prisma.billing.findMany({
      where:
        user.role === Role.ADMIN
          ? undefined
          : { subscription: { user_id: user.id } },
      include: billingInclude,
      orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
    });
  }

  async findOne(user: AuthUser, id: string) {
    const billing = await this.prisma.billing.findUnique({
      where: { id },
      include: billingInclude,
    });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    if (user.role !== Role.ADMIN && billing.subscription.user_id !== user.id) {
      throw new ForbiddenException('Anda tidak dapat mengakses tagihan ini');
    }
    return billing;
  }

  async update(id: string, dto: UpdateBillingDto) {
    const billing = await this.prisma.billing.findUnique({ where: { id } });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    if (billing.status === BillingStatus.PAID) {
      throw new ConflictException('Tagihan yang sudah lunas tidak dapat diubah');
    }

    try {
      return await this.prisma.billing.update({
        where: { id },
        data: {
          period_month: dto.period_month,
          period_year: dto.period_year,
          amount: dto.amount,
          due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        },
        include: billingInclude,
      });
    } catch (error) {
      this.handlePeriodUnique(error);
      throw error;
    }
  }

  async remove(id: string) {
    const billing = await this.prisma.billing.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    if (billing.payment) {
      throw new ConflictException(
        'Tagihan tidak dapat dihapus karena sudah memiliki pembayaran',
      );
    }
    return this.prisma.billing.delete({ where: { id } });
  }

  private handlePeriodUnique(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Tagihan untuk subscription dan periode tersebut sudah ada',
      );
    }
  }
}
