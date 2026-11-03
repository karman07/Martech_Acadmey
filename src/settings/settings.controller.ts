import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateRazorpaySettingsDto } from './dto/update-razorpay-settings.dto';
import { UpdateResendSettingsDto } from './dto/update-resend-settings.dto';
import { UpdatePayoutSettingsDto } from './dto/update-payout-settings.dto';

@Controller('admin/settings')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('razorpay')
  getRazorpay() {
    return this.settingsService.getRazorpaySettings();
  }

  @Put('razorpay')
  updateRazorpay(
    @CurrentProfile() profile: User,
    @Body() dto: UpdateRazorpaySettingsDto,
  ) {
    return this.settingsService.updateRazorpaySettings(profile.uid, dto);
  }

  @Get('resend')
  getResend() {
    return this.settingsService.getResendSettings();
  }

  @Put('resend')
  updateResend(
    @CurrentProfile() profile: User,
    @Body() dto: UpdateResendSettingsDto,
  ) {
    return this.settingsService.updateResendSettings(profile.uid, dto);
  }

  @Get('payout')
  getPayout() {
    return this.settingsService.getPayoutSettings();
  }

  @Put('payout')
  updatePayout(
    @CurrentProfile() profile: User,
    @Body() dto: UpdatePayoutSettingsDto,
  ) {
    return this.settingsService.updatePayoutSettings(profile.uid, dto);
  }
}
