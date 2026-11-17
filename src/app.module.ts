import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { BcryptModule } from './bcrypt/bcrypt.module.js';
import { FileStorageModule } from './file-storage/file-storage.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { UsersModule } from './users/users.module.js';
import { ElectricityServicesModule } from './electricity-services/electricity-services.module.js';
import { ElectricityAccountsModule } from './electricity-accounts/electricity-accounts.module.js';
import { BillingsModule } from './billings/billings.module.js';
import { PaymentsModule } from './payments/payments.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BcryptModule,
    FileStorageModule,
    AuthModule,
    UsersModule,
    ElectricityServicesModule,
    ElectricityAccountsModule,
    BillingsModule,
    PaymentsModule,
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'my-api',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
