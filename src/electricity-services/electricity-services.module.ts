import { Module } from '@nestjs/common';
import { ElectricityServicesController } from './electricity-services.controller.js';
import { ElectricityServicesService } from './electricity-services.service.js';

@Module({
  controllers: [ElectricityServicesController],
  providers: [ElectricityServicesService],
})
export class ElectricityServicesModule {}
