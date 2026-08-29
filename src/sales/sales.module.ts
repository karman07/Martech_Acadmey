import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { SalesController } from './sales.controller';
import { SalesAdminController } from './sales-admin.controller';
import { SalesService } from './sales.service';
import { SalesAdminService } from './sales-admin.service';

@Module({
  imports: [PaymentsModule],
  controllers: [SalesController, SalesAdminController],
  providers: [SalesService, SalesAdminService],
})
export class SalesModule {}
