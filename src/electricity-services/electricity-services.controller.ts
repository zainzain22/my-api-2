import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateElectricityServiceDto } from './dto/create-electricity-service.dto.js';
import { UpdateElectricityServiceDto } from './dto/update-electricity-service.dto.js';
import { ElectricityServicesService } from './electricity-services.service.js';

@Controller('electricity-services')
export class ElectricityServicesController {
  constructor(private readonly services: ElectricityServicesService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateElectricityServiceDto) {
    const data = await this.services.create(dto);
    return success(data, 'Layanan listrik dibuat');
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.services.findAll(user.role === Role.CUSTOMER);
    return success(data, 'Daftar layanan listrik');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.services.findOne(id);
    return success(data, 'Detail layanan listrik');
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateElectricityServiceDto,
  ) {
    const data = await this.services.update(id, dto);
    return success(data, 'Layanan listrik diperbarui');
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.services.remove(id);
    return success(data, 'Layanan listrik dihapus');
  }
}
