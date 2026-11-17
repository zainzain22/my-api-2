import {
  BadRequestException,
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
  electricity_account: {
    include: { electricity_service: true },
  },
  payment: true,
} as const;

@Injectable()
export class BillingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBillingDto) {
    this.assertMeter(dto.previous_meter, dto.current_meter);

    const account = await this.prisma.electricityAccount.findUnique({
      where: { id: dto.electricity_account_id },
      include: { electricity_service: true },
    });
    if (!account) {
      throw new NotFoundException('Akun listrik tidak ditemukan');
    }

    const consumption = dto.current_meter - dto.previous_meter;
    const tariff = Number(account.electricity_service.price_per_kwh);
    const amount = consumption * tariff;

    try {
      return await this.prisma.billing.create({
        data: {
          electricity_account_id: dto.electricity_account_id,
          period_month: dto.period_month,
          period_year: dto.period_year,
          previous_meter: dto.previous_meter,
          current_meter: dto.current_meter,
          consumption,
          tariff_per_kwh: tariff,
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
          : { electricity_account: { user_id: user.id } },
      include: billingInclude,
      orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
    });
  }

  async findOne(user: AuthUser, id: number) {
    const billing = await this.prisma.billing.findUnique({
      where: { id },
      include: billingInclude,
    });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    this.assertOwner(user, billing.electricity_account.user_id);
    return billing;
  }

  async update(id: number, dto: UpdateBillingDto) {
    const billing = await this.prisma.billing.findUnique({
      where: { id },
    });
    if (!billing) {
      throw new NotFoundException('Tagihan tidak ditemukan');
    }
    if (billing.status === BillingStatus.PAID) {
      throw new ConflictException('Tagihan yang sudah lunas tidak dapat diubah');
    }

    const previous = dto.previous_meter ?? Number(billing.previous_meter);
    const current = dto.current_meter ?? Number(billing.current_meter);
    this.assertMeter(previous, current);

    const consumption = current - previous;
    const amount = consumption * Number(billing.tariff_per_kwh);

    try {
      return await this.prisma.billing.update({
        where: { id },
        data: {
          period_month: dto.period_month,
          period_year: dto.period_year,
          previous_meter: dto.previous_meter,
          current_meter: dto.current_meter,
          consumption,
          amount,
          due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        },
        include: billingInclude,
      });
    } catch (error) {
      this.handlePeriodUnique(error);
      throw error;
    }
  }

  async remove(id: number) {
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

  private assertMeter(previous: number, current: number) {
    if (current < previous) {
      throw new BadRequestException(
        'current_meter harus lebih besar atau sama dengan previous_meter',
      );
    }
  }

  private assertOwner(user: AuthUser, ownerId: number) {
    if (user.role !== Role.ADMIN && user.id !== ownerId) {
      throw new ForbiddenException('Anda tidak dapat mengakses tagihan ini');
    }
  }

  private handlePeriodUnique(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Billing untuk akun dan periode tersebut sudah ada',
      );
    }
  }
}
