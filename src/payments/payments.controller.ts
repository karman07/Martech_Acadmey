import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly razorpay: RazorpayService,
  ) {}

  @Post('order')
  @UseGuards(FirebaseAuthGuard)
  createOrder(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentsService.createOrder(user.uid, dto);
  }

  @Post('verify')
  @UseGuards(FirebaseAuthGuard)
  verify(@CurrentUser() user: DecodedIdToken, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verify(user.uid, dto);
  }

  /** Razorpay server-to-server webhook — durable source of truth alongside /verify. */
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.body as Buffer;
    if (
      !Buffer.isBuffer(rawBody) ||
      !this.razorpay.verifyWebhookSignature(rawBody, signature)
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event: string;
      payload: {
        payment: { entity: { id: string; order_id: string } };
      };
    };

    const { order_id: orderId, id: paymentId } = event.payload.payment.entity;

    if (event.event === 'payment.captured') {
      const purchase =
        await this.paymentsService.findPurchaseByOrderId(orderId);
      if (purchase) {
        await this.paymentsService.finalize(purchase.id, paymentId);
      }
    } else if (event.event === 'payment.failed') {
      await this.paymentsService.markFailed(orderId);
    }

    return { received: true };
  }
}
