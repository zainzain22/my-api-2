import { Module } from '@nestjs/common';
import { ServiceProvidersController } from './service-providers.controller.js';
import { ServiceProvidersService } from './service-providers.service.js';

@Module({
  controllers: [ServiceProvidersController],
  providers: [ServiceProvidersService],
})
export class ServiceProvidersModule {}
