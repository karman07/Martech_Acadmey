import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { VerifyPaymentDto } from '../payments/dto/verify-payment.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
    private readonly payments: PaymentsService,
  ) {}

  async createEnquiry(salesRepUid: string, dto: CreateEnquiryDto) {
    return this.prisma.enquiry.create({
      data: { salesRepUid, ...dto },
    });
  }

  findMyEnquiries(salesRepUid: string, status?: string) {
    return this.prisma.enquiry.findMany({
      where: { salesRepUid, ...(status ? { status: status as never } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMe(salesRepUid: string) {
    const rep = await this.prisma.user.findUniqueOrThrow({ where: { uid: salesRepUid } });

    const [enquiryCount, openEnquiryCount, paidPurchases, payouts] = await Promise.all([
      this.prisma.enquiry.count({ where: { salesRepUid } }),
      this.prisma.enquiry.count({ where: { salesRepUid, status: 'open' } }),
      this.prisma.purchase.findMany({
        where: { salesRepUid, status: 'paid' },
        select: { amount: true, commissionAmount: true, createdAt: true, type: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.salesPayout.findMany({ where: { salesRepUid }, orderBy: { dateISO: 'desc' } }),
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
      enquiryCount,
      openEnquiryCount,
      enrollmentsSold: paidPurchases.length,
      totalCommissionEarned,
      totalPaidOut,
      totalCommissionOwed: totalCommissionEarned - totalPaidOut,
      recentSales: paidPurchases.slice(0, 10),
      payouts,
    };
  }

  /** Creates the student's Firebase Auth account + platform profile on the sales rep's behalf. */
  async createStudent(dto: { studentName: string; studentEmail: string; studentPhone?: string; password: string }) {
    let uid: string;
    try {
      const firebaseUser = await this.firebase.auth().createUser({
        email: dto.studentEmail,
        password: dto.password,
        displayName: dto.studentName,
      });
      uid = firebaseUser.uid;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-exists') {
        throw new BadRequestException('An account with this email already exists');
      }
      throw new BadRequestException('Could not create the student account');
    }

    const existing = await this.prisma.user.findUnique({ where: { uid } });
    if (existing) {
      throw new BadRequestException('This account is already set up on the platform');
    }

    return this.prisma.user.create({
      data: {
        uid,
        email: dto.studentEmail,
        name: dto.studentName,
        role: 'student',
        phone: dto.studentPhone,
      },
    });
  }

  /** Enrolls a student (creating their account first if they don't have one yet) and starts a Razorpay order attributed to this sales rep. */
  async enroll(salesRepUid: string, dto: EnrollStudentDto) {
    const rep = await this.prisma.user.findUniqueOrThrow({ where: { uid: salesRepUid } });
    const commissionPercent = rep.commissionPercent?.toNumber() ?? 0;

    let student = await this.prisma.user.findFirst({ where: { email: dto.studentEmail } });
    if (!student) {
      student = await this.createStudent(dto);
    } else if (student.role !== 'student') {
      throw new BadRequestException('This email belongs to a non-student account');
    }

    const order = await this.payments.createOrder(
      student.uid,
      { type: dto.type, refId: dto.refId },
      { salesRepUid, commissionPercent },
    );

    return { student: { uid: student.uid, name: student.name, email: student.email }, order };
  }

  verifyEnrollment(salesRepUid: string, dto: VerifyPaymentDto) {
    return this.payments.verifyForSalesRep(salesRepUid, dto);
  }
}
