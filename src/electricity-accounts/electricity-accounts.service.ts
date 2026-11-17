import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { Prisma, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateElectricityAccountDto } from './dto/create-electricity-account.dto.js';

const accountInclude = {
  electricity_service: true,
} as const;

@Injectable()
export class ElectricityAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateElectricityAccountDto) {
    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Hanya customer yang dapat mendaftarkan akun listrik');
    }

    const service = await this.prisma.electricityService.findUnique({
      where: { id: dto.electricity_service_id },
    });
    if (!service || !service.is_active) {
      throw new BadRequestException('Layanan listrik tidak tersedia');
    }

    try {
      return await this.prisma.electricityAccount.create({
        data: {
          user_id: user.id,
          electricity_service_id: dto.electricity_service_id,
          customer_number: dto.customer_number,
          customer_name: dto.customer_name,
          address: dto.address,
        },
        include: accountInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Nomor pelanggan sudah terdaftar');
      }
      throw error;
    }
  }

  findAll(user: AuthUser) {
    return this.prisma.electricityAccount.findMany({
      where: user.role === Role.ADMIN ? undefined : { user_id: user.id },
      include: accountInclude,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(user: AuthUser, id: number) {
    const account = await this.prisma.electricityAccount.findUnique({
      where: { id },
      include: accountInclude,
    });
    if (!account) {
      throw new NotFoundException('Akun listrik tidak ditemukan');
    }
    if (user.role !== Role.ADMIN && account.user_id !== user.id) {
      throw new ForbiddenException('Anda tidak dapat mengakses akun listrik ini');
    }
    return account;
  }
}
