import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { PayoutAccountsController } from './payout-accounts.controller';
import { PayoutAccountsService } from './payout-accounts.service';
import { MailModule } from '../mail/mail.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [MailModule, PayoutsModule],
  controllers: [PaymentsController, PayoutAccountsController],
  providers: [PaymentsService, RazorpayService, PayoutAccountsService],
  exports: [PaymentsService, PayoutAccountsService],
})
export class PaymentsModule {}
