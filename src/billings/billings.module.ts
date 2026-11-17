import { Module } from '@nestjs/common';
import { BillingsController } from './billings.controller.js';
import { BillingsService } from './billings.service.js';

@Module({
  controllers: [BillingsController],
  providers: [BillingsService],
})
export class BillingsModule {}
