import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { success } from '../common/http.js';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto.js';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto.js';
import { ServiceProvidersService } from './service-providers.service.js';

@Controller('service-providers')
export class ServiceProvidersController {
  constructor(private readonly providers: ServiceProvidersService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateServiceProviderDto) {
    const data = await this.providers.create(dto);
    return success(data, 'Paket layanan dibuat');
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.providers.findAll(user);
    return success(data, 'Daftar paket layanan');
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.providers.findOne(user, id);
    return success(data, 'Detail paket layanan');
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateServiceProviderDto,
  ) {
    const data = await this.providers.update(id, dto);
    return success(data, 'Paket layanan diperbarui');
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const data = await this.providers.remove(id);
    return success(data, 'Paket layanan dihapus');
  }
}
