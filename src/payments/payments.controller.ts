import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Role } from '../generated/prisma/client.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { success } from '../common/http.js';
import { ListPaymentsQueryDto } from './dto/list-payments.query.js';
import { UploadPaymentDto } from './dto/upload-payment.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  @UseInterceptors(
    FileInterceptor('payment_proof', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadPaymentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.payments.uploadProof(user, dto.billing_id, file);
    return success(data, 'Bukti pembayaran diunggah');
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListPaymentsQueryDto,
  ) {
    const data = await this.payments.findAll(user, query.status);
    return success(data, 'Daftar pembayaran');
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.payments.findOne(user, id);
    return success(data, 'Detail pembayaran');
  }

  @Roles(Role.ADMIN)
  @Patch(':id/verify')
  async verify(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    const data = await this.payments.verify(user, id, dto.action);
    return success(
      data,
      dto.action === 'APPROVE' ? 'Pembayaran disetujui' : 'Pembayaran ditolak',
    );
  }
}
