import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateSalesRepDto } from './dto/create-sales-rep.dto';
import { CreateSalesPayoutDto } from './dto/create-sales-payout.dto';
import { UpdateSalesPayoutStatusDto } from './dto/update-sales-payout-status.dto';

@Injectable()
export class SalesAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {}

  async createSalesRep(dto: CreateSalesRepDto) {
    let uid: string;
    try {
      const firebaseUser = await this.firebase.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.name,
      });
      uid = firebaseUser.uid;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-exists') {
        throw new BadRequestException('An account with this email already exists');
      }
      throw new BadRequestException('Could not create this account');
    }

    return this.prisma.user.create({
      data: {
        uid,
        email: dto.email,
        name: dto.name,
        role: 'sales',
        commissionPercent: dto.commissionPercent,
      },
    });
  }

  async findAllSalesReps() {
    const reps = await this.prisma.user.findMany({
      where: { role: 'sales' },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      reps.map(async (rep) => {
        const [enquiryCount, openEnquiryCount, paidPurchases, payouts] = await Promise.all([
          this.prisma.enquiry.count({ where: { salesRepUid: rep.uid } }),
          this.prisma.enquiry.count({ where: { salesRepUid: rep.uid, status: 'open' } }),
          this.prisma.purchase.findMany({
            where: { salesRepUid: rep.uid, status: 'paid' },
            select: { commissionAmount: true },
          }),
          this.prisma.salesPayout.findMany({ where: { salesRepUid: rep.uid }, select: { amount: true, status: true } }),
        ]);

        const totalCommissionEarned = paidPurchases.reduce(
          (sum, p) => sum + (p.commissionAmount?.toNumber() ?? 0),
          0,
        );
        const totalPaidOut = payouts
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount.toNumber(), 0);

        return {
          uid: rep.uid,
          name: rep.name,
          email: rep.email,
          commissionPercent: rep.commissionPercent?.toNumber() ?? 0,
          createdAt: rep.createdAt,
          enquiryCount,
          openEnquiryCount,
          enrollmentsSold: paidPurchases.length,
          totalCommissionEarned,
          totalPaidOut,
          totalCommissionOwed: totalCommissionEarned - totalPaidOut,
        };
      }),
    );
  }

  async updateCommission(uid: string, commissionPercent: number) {
    const rep = await this.prisma.user.findUnique({ where: { uid } });
    if (!rep || rep.role !== 'sales') {
      throw new NotFoundException('Sales rep not found');
    }
    return this.prisma.user.update({ where: { uid }, data: { commissionPercent } });
  }

  findAllEnquiries(status?: string) {
    return this.prisma.enquiry.findMany({
      where: status ? { status: status as never } : undefined,
      include: { salesRep: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markEnquiryDone(id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }
    return this.prisma.enquiry.update({
      where: { id },
      data: { status: 'done', doneAt: new Date() },
    });
  }

  findAllPayouts(salesRepUid?: string) {
    return this.prisma.salesPayout.findMany({
      where: salesRepUid ? { salesRepUid } : undefined,
      include: { salesRep: { select: { name: true, email: true } } },
      orderBy: { dateISO: 'desc' },
    });
  }

  createPayout(dto: CreateSalesPayoutDto) {
    return this.prisma.salesPayout.create({
      data: { ...dto, dateISO: new Date(dto.dateISO) },
    });
  }

  async updatePayoutStatus(id: string, dto: UpdateSalesPayoutStatusDto) {
    const payout = await this.prisma.salesPayout.findUnique({ where: { id } });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    return this.prisma.salesPayout.update({ where: { id }, data: { status: dto.status } });
  }
}
