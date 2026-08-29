import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private client: Razorpay | null = null;
  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID ?? '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  }

  /** Lazy — so the app still boots before Razorpay credentials are configured. */
  private getClient(): Razorpay {
    if (!this.keyId || !this.keySecret) {
      throw new InternalServerErrorException(
        'Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET',
      );
    }
    this.client ??= new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
    return this.client;
  }

  createOrder(amountInPaise: number, currency: string, receipt: string) {
    return this.getClient().orders.create({
      amount: amountInPaise,
      currency,
      receipt,
    });
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const expected = createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeCompare(expected, signature);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return safeCompare(expected, signature);
  }
}

function safeCompare(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual ?? '');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
