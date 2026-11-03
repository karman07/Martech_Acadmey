import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 'singleton';
const SANDBOX_FROM = 'onboarding@resend.dev';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Admin-saved key/from-address win; falls back to .env / Resend's sandbox address for a
   * fresh deploy nobody has configured yet. Queried fresh every time (no in-memory caching)
   * so a value saved in the admin panel takes effect on the very next email — no restart. */
  private async getConfig(): Promise<{ apiKey: string; from: string }> {
    const settings = await this.prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return {
      apiKey: settings?.resendApiKey || process.env.RESEND_API_KEY || '',
      from: settings?.resendFromEmail || SANDBOX_FROM,
    };
  }

  /** Sends a transactional email via Resend. Never throws — email is a side effect of
   * enrollment/payment flows and must never break them. Failures are logged, not surfaced. */
  async send({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const { apiKey, from } = await this.getConfig();
      if (!apiKey) {
        this.logger.warn(`Skipped sending "${subject}" to ${to} — Resend is not configured.`);
        return;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.error(`Resend send failed (${response.status}) for "${subject}" to ${to}: ${body}`);
      }
    } catch (err) {
      this.logger.error(
        `Resend send threw for "${subject}" to ${to}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
