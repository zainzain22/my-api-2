import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { success } from '../common/http.js';
import { CreateElectricityAccountDto } from './dto/create-electricity-account.dto.js';
import { ElectricityAccountsService } from './electricity-accounts.service.js';

@Controller('electricity-accounts')
export class ElectricityAccountsController {
  constructor(private readonly accounts: ElectricityAccountsService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateElectricityAccountDto,
  ) {
    const data = await this.accounts.create(user, dto);
    return success(data, 'Akun listrik didaftarkan');
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.accounts.findAll(user);
    return success(data, 'Daftar akun listrik');
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.accounts.findOne(user, id);
    return success(data, 'Detail akun listrik');
  }
}
