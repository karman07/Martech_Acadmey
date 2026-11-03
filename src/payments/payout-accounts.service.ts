import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { SubmitPayoutAccountDto } from './dto/submit-payout-account.dto';

/** Razorpay's SDK rejects with `{ statusCode, error: { description } }` rather than a real
 * Error instance for API-level failures — fall back to a generic message for anything else. */
function extractRazorpayErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const description = (err as { error?: { description?: string } }).error?.description;
    if (description) return description;
  }
  if (err instanceof Error) return err.message;
  return 'Could not set up automatic payouts right now.';
}

@Injectable()
export class PayoutAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async getMine(teacherUid: string) {
    const account = await this.prisma.teacherPayoutAccount.findUnique({
      where: { userUid: teacherUid },
    });
    return (
      account ?? {
        userUid: teacherUid,
        legalName: null,
        pan: null,
        addressLine: null,
        city: null,
        state: null,
        postalCode: null,
        accountHolderName: null,
        accountNumber: null,
        ifsc: null,
        upiVpa: null,
        status: 'not_submitted' as const,
        statusMessage: null,
        updatedAt: null,
      }
    );
  }

  /** Saves the teacher's details either way, then attempts real Route onboarding with
   * Razorpay. Today (Route not yet activated) this call is expected to fail — that's
   * recorded as status "failed" with the real error message, not thrown back to the
   * teacher as a crash. Once Route is live, this same code path succeeds. */
  async submit(teacherUid: string, dto: SubmitPayoutAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { uid: teacherUid } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.email) {
      throw new BadRequestException('Your account needs an email on file before you can set up payouts.');
    }

    await this.prisma.teacherPayoutAccount.upsert({
      where: { userUid: teacherUid },
      create: { userUid: teacherUid, ...dto, status: 'pending' },
      update: { ...dto, status: 'pending', statusMessage: null },
    });

    return this.attemptOnboarding(teacherUid, user.email, user.phone, dto);
  }

  async retry(teacherUid: string) {
    const [user, account] = await Promise.all([
      this.prisma.user.findUnique({ where: { uid: teacherUid } }),
      this.prisma.teacherPayoutAccount.findUnique({ where: { userUid: teacherUid } }),
    ]);
    if (!user || !account) throw new NotFoundException('Submit your payout details first.');
    if (!user.email) {
      throw new BadRequestException('Your account needs an email on file before you can set up payouts.');
    }
    if (!account.accountNumber || !account.ifsc) {
      throw new BadRequestException('Bank account number and IFSC are required — submit your details again.');
    }

    await this.prisma.teacherPayoutAccount.update({
      where: { userUid: teacherUid },
      data: { status: 'pending', statusMessage: null },
    });

    return this.attemptOnboarding(teacherUid, user.email, user.phone, {
      ...account,
      accountNumber: account.accountNumber,
      ifsc: account.ifsc,
    });
  }

  private async attemptOnboarding(
    teacherUid: string,
    email: string,
    phone: string | null,
    details: {
      legalName: string;
      pan?: string | null;
      addressLine: string;
      city: string;
      state: string;
      postalCode: string;
      accountHolderName: string;
      accountNumber: string;
      ifsc: string;
    },
  ) {
    try {
      const { razorpayAccountId, razorpayProductId } = await this.razorpay.createLinkedAccount({
        legalName: details.legalName,
        email,
        phone: phone || '9999999999',
        pan: details.pan ?? undefined,
        addressLine: details.addressLine,
        city: details.city,
        state: details.state,
        postalCode: details.postalCode,
        accountHolderName: details.accountHolderName,
        accountNumber: details.accountNumber,
        ifsc: details.ifsc,
      });

      return this.prisma.teacherPayoutAccount.update({
        where: { userUid: teacherUid },
        data: {
          status: 'active',
          statusMessage: null,
          razorpayAccountId,
          razorpayProductId,
        },
      });
    } catch (err) {
      const message = extractRazorpayErrorMessage(err);
      return this.prisma.teacherPayoutAccount.update({
        where: { userUid: teacherUid },
        data: { status: 'failed', statusMessage: message },
      });
    }
  }
}
