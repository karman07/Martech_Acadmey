import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 'singleton';

@Injectable()
export class RazorpayService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin-saved keys win; falls back to .env for a fresh deploy nobody has configured yet.
   * Queried fresh every time (no in-memory caching) so a key saved in the admin panel takes
   * effect on the very next request — no server restart required. */
  private async getKeys(): Promise<{ keyId: string; keySecret: string; webhookSecret: string }> {
    const settings = await this.prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
    return {
      keyId: settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '',
      keySecret: settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: settings?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
    };
  }

  async getKeyId(): Promise<string> {
    return (await this.getKeys()).keyId;
  }

  private async getClient(): Promise<Razorpay> {
    const { keyId, keySecret } = await this.getKeys();
    if (!keyId || !keySecret) {
      throw new InternalServerErrorException(
        'Razorpay is not configured — add your keys under Admin → Settings.',
      );
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async createOrder(amountInPaise: number, currency: string, receipt: string) {
    const client = await this.getClient();
    return client.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
    });
  }

  async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<boolean> {
    const { keySecret } = await this.getKeys();
    const expected = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeCompare(expected, signature);
  }

  async verifyWebhookSignature(rawBody: Buffer, signature: string): Promise<boolean> {
    const { webhookSecret } = await this.getKeys();
    if (!webhookSecret) return false;
    const expected = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    return safeCompare(expected, signature);
  }

  /**
   * Route onboarding for a teacher: creates the linked (sub-merchant) account, attaches
   * stakeholder KYC, then requests+configures the "route" product with the teacher's
   * settlement bank account. Throws on any step's failure — the caller (PayoutAccountsService)
   * decides what to persist. This will fail end-to-end until Route is activated on the
   * platform's Razorpay account; that's expected, not a bug in this method.
   */
  async createLinkedAccount(details: {
    legalName: string;
    email: string;
    phone: string;
    pan?: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
  }): Promise<{ razorpayAccountId: string; razorpayProductId: string }> {
    const client = await this.getClient();

    const account = await client.accounts.create({
      email: details.email,
      phone: details.phone,
      business_type: 'individual',
      legal_business_name: details.legalName,
      contact_name: details.legalName,
      profile: {
        category: 'education',
        subcategory: 'ed_tech',
        addresses: {
          registered: {
            street1: details.addressLine,
            street2: '',
            city: details.city,
            state: details.state,
            postal_code: details.postalCode,
            country: 'IN',
          },
        },
      },
      ...(details.pan && { legal_info: { pan: details.pan } }),
    } as Parameters<typeof client.accounts.create>[0]);

    await client.stakeholders.create(account.id, {
      name: details.legalName,
      email: details.email,
      phone: { primary: details.phone },
      kyc: { pan: details.pan ?? '' },
    } as Parameters<typeof client.stakeholders.create>[1]);

    const product = await client.products.requestProductConfiguration(account.id, {
      product_name: 'route',
      tnc_accepted: true,
    } as Parameters<typeof client.products.requestProductConfiguration>[1]);

    await client.products.edit(account.id, product.id, {
      settlements: {
        account_number: details.accountNumber,
        ifsc_code: details.ifsc,
        beneficiary_name: details.accountHolderName,
      },
    } as Parameters<typeof client.products.edit>[2]);

    return { razorpayAccountId: account.id, razorpayProductId: product.id };
  }

  /** Moves the teacher's share of a course purchase to their linked Route account. Amount
   * is in paise. Throws on failure — the caller decides how to record it. */
  async transferToLinkedAccount(linkedAccountId: string, amountInPaise: number) {
    const client = await this.getClient();
    return client.transfers.create({
      account: linkedAccountId,
      amount: amountInPaise,
      currency: 'INR',
    });
  }
}

function safeCompare(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual ?? '');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
