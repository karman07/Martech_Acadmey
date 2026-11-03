import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRazorpaySettingsDto } from './dto/update-razorpay-settings.dto';
import { UpdateResendSettingsDto } from './dto/update-resend-settings.dto';
import { UpdatePayoutSettingsDto } from './dto/update-payout-settings.dto';

const SETTINGS_ID = 'singleton';

function maskSecret(secret?: string | null): string | null {
  if (!secret) return null;
  return secret.length <= 4 ? '••••' : `••••${secret.slice(-4)}`;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRazorpaySettings() {
    const settings = await this.prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || null;
    const keySecretSource = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
    const webhookSecretSource =
      settings?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

    return {
      keyId,
      keySecretConfigured: Boolean(keySecretSource),
      keySecretPreview: maskSecret(keySecretSource),
      webhookSecretConfigured: Boolean(webhookSecretSource),
      webhookSecretPreview: maskSecret(webhookSecretSource),
      usingEnvFallback: !settings?.razorpayKeyId && Boolean(process.env.RAZORPAY_KEY_ID),
      updatedAt: settings?.updatedAt ?? null,
    };
  }

  async updateRazorpaySettings(adminUid: string, dto: UpdateRazorpaySettingsDto) {
    const data = {
      ...(dto.keyId !== undefined && { razorpayKeyId: dto.keyId || null }),
      ...(dto.keySecret !== undefined && { razorpayKeySecret: dto.keySecret || null }),
      ...(dto.webhookSecret !== undefined && {
        razorpayWebhookSecret: dto.webhookSecret || null,
      }),
      updatedByUid: adminUid,
    };

    await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    return this.getRazorpaySettings();
  }

  async getResendSettings() {
    const settings = await this.prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    const keySource = settings?.resendApiKey || process.env.RESEND_API_KEY;

    return {
      keyConfigured: Boolean(keySource),
      keyPreview: maskSecret(keySource),
      fromEmail: settings?.resendFromEmail || null,
      usingEnvFallback: !settings?.resendApiKey && Boolean(process.env.RESEND_API_KEY),
      updatedAt: settings?.updatedAt ?? null,
    };
  }

  async updateResendSettings(adminUid: string, dto: UpdateResendSettingsDto) {
    const data = {
      ...(dto.apiKey !== undefined && { resendApiKey: dto.apiKey || null }),
      ...(dto.fromEmail !== undefined && { resendFromEmail: dto.fromEmail || null }),
      updatedByUid: adminUid,
    };

    await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    return this.getResendSettings();
  }

  /** Where the platform's own commission should be paid out to — reference info only, shown
   * in full (not masked) since it's not an API credential, and only admins can see this page. */
  async getPayoutSettings() {
    const settings = await this.prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    return {
      upiId: settings?.payoutUpiId || null,
      accountName: settings?.payoutAccountName || null,
      accountNumber: settings?.payoutAccountNumber || null,
      ifsc: settings?.payoutIfsc || null,
      updatedAt: settings?.updatedAt ?? null,
    };
  }

  async updatePayoutSettings(adminUid: string, dto: UpdatePayoutSettingsDto) {
    const data = {
      ...(dto.upiId !== undefined && { payoutUpiId: dto.upiId || null }),
      ...(dto.accountName !== undefined && { payoutAccountName: dto.accountName || null }),
      ...(dto.accountNumber !== undefined && { payoutAccountNumber: dto.accountNumber || null }),
      ...(dto.ifsc !== undefined && { payoutIfsc: dto.ifsc || null }),
      updatedByUid: adminUid,
    };

    await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    return this.getPayoutSettings();
  }
}
