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
import { BillingsService } from './billings.service.js';
import { CreateBillingDto } from './dto/create-billing.dto.js';
import { UpdateBillingDto } from './dto/update-billing.dto.js';

@Controller('billings')
export class BillingsController {
  constructor(private readonly billings: BillingsService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateBillingDto) {
    const data = await this.billings.create(dto);
    return success(data, 'Tagihan dibuat');
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.billings.findAll(user);
    return success(data, 'Daftar tagihan');
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.billings.findOne(user, id);
    return success(data, 'Detail tagihan');
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateBillingDto,
  ) {
    const data = await this.billings.update(id, dto);
    return success(data, 'Tagihan diperbarui');
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const data = await this.billings.remove(id);
    return success(data, 'Tagihan dihapus');
  }
}
