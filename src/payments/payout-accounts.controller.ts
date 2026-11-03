import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { PayoutAccountsService } from './payout-accounts.service';
import { SubmitPayoutAccountDto } from './dto/submit-payout-account.dto';

@Controller('teacher/payout-account')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class PayoutAccountsController {
  constructor(private readonly payoutAccounts: PayoutAccountsService) {}

  @Get()
  getMine(@CurrentProfile() profile: User) {
    return this.payoutAccounts.getMine(profile.uid);
  }

  @Post()
  submit(@CurrentProfile() profile: User, @Body() dto: SubmitPayoutAccountDto) {
    return this.payoutAccounts.submit(profile.uid, dto);
  }

  @Post('retry')
  retry(@CurrentProfile() profile: User) {
    return this.payoutAccounts.retry(profile.uid);
  }
}
