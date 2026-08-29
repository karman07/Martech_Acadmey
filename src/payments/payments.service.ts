import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { computeListPrice, discounted } from '../common/pricing.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import type { PurchaseType } from '@prisma/client';

type Purchasable = {
  id: string;
  status: string;
  price: { toNumber(): number };
  marginPercent: number;
  discountPercent: number;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  private async loadContent(
    type: PurchaseType,
    refId: string,
  ): Promise<Purchasable> {
    switch (type) {
      case 'course':
        return this.prisma.course
          .findUniqueOrThrow({ where: { id: refId } })
          .catch(() => {
            throw new NotFoundException('Course not found');
          });
      case 'ebook':
        return this.prisma.ebook
          .findUniqueOrThrow({ where: { id: refId } })
          .catch(() => {
            throw new NotFoundException('Ebook not found');
          });
      case 'bootcamp':
        return this.prisma.bootcamp
          .findUniqueOrThrow({ where: { id: refId } })
          .catch(() => {
            throw new NotFoundException('Bootcamp not found');
          });
      case 'bundle':
        return this.prisma.bundle
          .findUniqueOrThrow({ where: { id: refId } })
          .catch(() => {
            throw new NotFoundException('Bundle not found');
          });
    }
  }

  private async alreadyOwns(
    userUid: string,
    type: PurchaseType,
    refId: string,
  ): Promise<boolean> {
    switch (type) {
      case 'course':
        return Boolean(
          await this.prisma.enrollment.findUnique({
            where: { userUid_courseId: { userUid, courseId: refId } },
          }),
        );
      case 'ebook':
        return Boolean(
          await this.prisma.ebookPurchase.findUnique({
            where: { userUid_ebookId: { userUid, ebookId: refId } },
          }),
        );
      case 'bootcamp':
        return Boolean(
          await this.prisma.bootcampApplication.findUnique({
            where: { userUid_bootcampId: { userUid, bootcampId: refId } },
          }),
        );
      case 'bundle':
        return Boolean(
          await this.prisma.bundlePurchase.findUnique({
            where: { userUid_bundleId: { userUid, bundleId: refId } },
          }),
        );
    }
  }

  async createOrder(
    userUid: string,
    dto: CreateOrderDto,
    salesAttribution?: { salesRepUid: string; commissionPercent: number },
  ) {
    const content = await this.loadContent(dto.type, dto.refId);
    if (content.status !== 'published') {
      throw new BadRequestException('This item is not available for purchase');
    }

    if (await this.alreadyOwns(userUid, dto.type, dto.refId)) {
      throw new ConflictException('Already purchased');
    }

    const listPrice = computeListPrice(
      content.price.toNumber(),
      content.marginPercent,
    );
    const finalPrice = discounted(listPrice, content.discountPercent);

    if (finalPrice <= 0) {
      throw new BadRequestException(
        'This item is free — use /enrollments instead',
      );
    }

    const order = await this.razorpay.createOrder(
      Math.round(finalPrice * 100),
      'INR',
      `${dto.type}_${dto.refId}_${Date.now()}`.slice(0, 40),
    );

    await this.prisma.purchase.create({
      data: {
        userUid,
        type: dto.type,
        refId: dto.refId,
        amount: finalPrice,
        razorpayOrderId: order.id,
        ...(salesAttribution && {
          salesRepUid: salesAttribution.salesRepUid,
          commissionPercent: salesAttribution.commissionPercent,
        }),
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.razorpay.keyId,
    };
  }

  async verify(userUid: string, dto: VerifyPaymentDto) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { razorpayOrderId: dto.razorpay_order_id },
    });

    if (!purchase || purchase.userUid !== userUid) {
      throw new NotFoundException('Purchase not found');
    }

    return this.verifyAndFinalize(purchase, dto);
  }

  /** Same as verify(), but for a sales rep confirming a purchase they created on a student's behalf — ownership is checked against salesRepUid, not the buyer's own uid. */
  async verifyForSalesRep(salesRepUid: string, dto: VerifyPaymentDto) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { razorpayOrderId: dto.razorpay_order_id },
    });

    if (!purchase || purchase.salesRepUid !== salesRepUid) {
      throw new NotFoundException('Purchase not found');
    }

    return this.verifyAndFinalize(purchase, dto);
  }

  private async verifyAndFinalize(
    purchase: { id: string; status: string },
    dto: VerifyPaymentDto,
  ) {
    if (purchase.status === 'paid') {
      return { status: 'paid' };
    }

    const valid = this.razorpay.verifyPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );

    if (!valid) {
      throw new ForbiddenException('Payment signature verification failed');
    }

    await this.finalize(purchase.id, dto.razorpay_payment_id);
    return { status: 'paid' };
  }

  /** Shared by the client-redirect /verify flow and the server-to-server webhook. Idempotent. */
  async finalize(purchaseId: string, razorpayPaymentId: string) {
    const purchase = await this.prisma.purchase.findUniqueOrThrow({
      where: { id: purchaseId },
    });
    if (purchase.status === 'paid') return;

    const commissionAmount =
      purchase.salesRepUid && purchase.commissionPercent
        ? purchase.amount.toNumber() * (purchase.commissionPercent.toNumber() / 100)
        : undefined;

    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'paid',
        razorpayPaymentId,
        ...(commissionAmount !== undefined && { commissionAmount }),
      },
    });

    await this.grantOwnership(
      purchase.userUid,
      purchase.type,
      purchase.refId,
      purchase.id,
    );
  }

  async markFailed(razorpayOrderId: string) {
    await this.prisma.purchase.updateMany({
      where: { razorpayOrderId, status: 'created' },
      data: { status: 'failed' },
    });
  }

  async findPurchaseByOrderId(razorpayOrderId: string) {
    return this.prisma.purchase.findUnique({ where: { razorpayOrderId } });
  }

  private async grantOwnership(
    userUid: string,
    type: PurchaseType,
    refId: string,
    purchaseId: string,
  ) {
    switch (type) {
      case 'course':
        await this.prisma.enrollment.upsert({
          where: { userUid_courseId: { userUid, courseId: refId } },
          update: {},
          create: { userUid, courseId: refId, purchaseId },
        });
        return;
      case 'ebook':
        await this.prisma.ebookPurchase.upsert({
          where: { userUid_ebookId: { userUid, ebookId: refId } },
          update: {},
          create: { userUid, ebookId: refId, purchaseId },
        });
        return;
      case 'bootcamp':
        await this.prisma.$transaction([
          this.prisma.bootcampApplication.upsert({
            where: { userUid_bootcampId: { userUid, bootcampId: refId } },
            update: {},
            create: { userUid, bootcampId: refId, purchaseId },
          }),
          this.prisma.bootcamp.update({
            where: { id: refId },
            data: { seatsRemaining: { decrement: 1 } },
          }),
        ]);
        return;
      case 'bundle': {
        await this.prisma.bundlePurchase.upsert({
          where: { userUid_bundleId: { userUid, bundleId: refId } },
          update: {},
          create: { userUid, bundleId: refId, purchaseId },
        });
        const courseLinks = await this.prisma.bundleCourse.findMany({
          where: { bundleId: refId },
        });
        await Promise.all(
          courseLinks.map((link) =>
            this.prisma.enrollment.upsert({
              where: { userUid_courseId: { userUid, courseId: link.courseId } },
              update: {},
              create: { userUid, courseId: link.courseId, purchaseId },
            }),
          ),
        );
        return;
      }
    }
  }
}
