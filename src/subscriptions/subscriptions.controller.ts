import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { success } from '../common/http.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const data = await this.subscriptions.create(user, dto);
    return success(data, 'Layanan internet didaftarkan');
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.subscriptions.findAll(user);
    return success(data, 'Daftar subscription');
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.subscriptions.findOne(user, id);
    return success(data, 'Detail subscription');
  }
}
