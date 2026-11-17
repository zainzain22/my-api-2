import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateElectricityServiceDto } from './dto/create-electricity-service.dto.js';
import { UpdateElectricityServiceDto } from './dto/update-electricity-service.dto.js';

@Injectable()
export class ElectricityServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateElectricityServiceDto) {
    try {
      return await this.prisma.electricityService.create({
        data: {
          code: dto.code,
          name: dto.name,
          power_va: dto.power_va,
          price_per_kwh: dto.price_per_kwh,
          is_active: dto.is_active ?? true,
        },
      });
    } catch (error) {
      this.handleUnique(error);
      throw error;
    }
  }

  findAll(activeOnly = false) {
    return this.prisma.electricityService.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const service = await this.prisma.electricityService.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Layanan listrik tidak ditemukan');
    }
    return service;
  }

  async update(id: number, dto: UpdateElectricityServiceDto) {
    await this.findOne(id);
    try {
      return await this.prisma.electricityService.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.handleUnique(error);
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    const related = await this.prisma.electricityAccount.count({
      where: { electricity_service_id: id },
    });
    if (related > 0) {
      throw new ConflictException(
        'Layanan tidak dapat dihapus karena sudah memiliki akun listrik',
      );
    }
    return this.prisma.electricityService.delete({ where: { id } });
  }

  private handleUnique(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Kode layanan listrik sudah digunakan');
    }
  }
}
