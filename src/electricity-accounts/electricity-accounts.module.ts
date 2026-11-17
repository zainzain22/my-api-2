import { Module } from '@nestjs/common';
import { ElectricityAccountsController } from './electricity-accounts.controller.js';
import { ElectricityAccountsService } from './electricity-accounts.service.js';

@Module({
  controllers: [ElectricityAccountsController],
  providers: [ElectricityAccountsService],
})
export class ElectricityAccountsModule {}
