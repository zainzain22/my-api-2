import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto.js';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto.js';

@Injectable()
export class ServiceProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateServiceProviderDto) {
    return this.prisma.serviceProvider.create({
      data: {
        name: dto.name,
        description: dto.description,
        speed: dto.speed,
        price_per_month: dto.price_per_month,
        is_active: dto.is_active ?? true,
      },
    });
  }

  findAll(user: AuthUser) {
    return this.prisma.serviceProvider.findMany({
      where: user.role === Role.CUSTOMER ? { is_active: true } : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!provider) {
      throw new NotFoundException('Paket layanan tidak ditemukan');
    }
    if (user.role === Role.CUSTOMER && !provider.is_active) {
      throw new ForbiddenException('Paket layanan tidak tersedia');
    }
    return provider;
  }

  async update(id: string, dto: UpdateServiceProviderDto) {
    await this.ensureExists(id);
    return this.prisma.serviceProvider.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const related = await this.prisma.subscription.count({
      where: { service_provider_id: id },
    });
    if (related > 0) {
      throw new ConflictException(
        'Paket layanan tidak dapat dihapus karena sudah memiliki subscription',
      );
    }
    return this.prisma.serviceProvider.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!provider) {
      throw new NotFoundException('Paket layanan tidak ditemukan');
    }
    return provider;
  }
}
