import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class CourseNotificationsService {
  private readonly logger = new Logger(CourseNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private async adminEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true },
    });
    return admins.map((a) => a.email).filter((e): e is string => Boolean(e));
  }

  /** Fires on every new course enrollment, free or paid — notifies the student, the
   * course's teacher, and every admin. Called from enrollFree() directly, and from
   * payments.service.ts's finalize() for paid course purchases. */
  async notifyEnrollment(courseId: string, studentUid: string): Promise<void> {
    const [course, student, adminEmails] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, teacher: { select: { name: true, email: true } } },
      }),
      this.prisma.user.findUnique({
        where: { uid: studentUid },
        select: { name: true, email: true },
      }),
      this.adminEmails(),
    ]);

    if (!course) {
      this.logger.warn(`notifyEnrollment: course ${courseId} not found`);
      return;
    }

    const studentName = student?.name ?? 'A student';

    if (student?.email) {
      await this.mail.send({
        to: student.email,
        subject: `You're enrolled — ${course.title}`,
        html: `<p>Hi ${studentName},</p><p>You're enrolled in <strong>${course.title}</strong>. Happy learning!</p>`,
      });
    }

    if (course.teacher.email) {
      await this.mail.send({
        to: course.teacher.email,
        subject: `New student enrolled — ${course.title}`,
        html: `<p>Hi ${course.teacher.name},</p><p><strong>${studentName}</strong> just enrolled in <strong>${course.title}</strong>.</p>`,
      });
    }

    for (const email of adminEmails) {
      await this.mail.send({
        to: email,
        subject: `New enrollment — ${course.title}`,
        html: `<p><strong>${studentName}</strong> enrolled in <strong>${course.title}</strong> (teacher: ${course.teacher.name}).</p>`,
      });
    }
  }

  /** Fires once a paid course purchase completes — tells the teacher what they earned and
   * tells admin what the platform's commission was. The split isn't stored anywhere today,
   * so it's computed here: the teacher is always owed their own listed price (course.price);
   * whatever the student actually paid beyond that is the platform's commission. */
  async notifyPaymentSplit(courseId: string, purchaseAmount: number): Promise<void> {
    const [course, adminEmails] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, price: true, teacher: { select: { name: true, email: true } } },
      }),
      this.adminEmails(),
    ]);

    if (!course) {
      this.logger.warn(`notifyPaymentSplit: course ${courseId} not found`);
      return;
    }

    const teacherEarning = course.price.toNumber();
    const platformCommission = Math.round((purchaseAmount - teacherEarning) * 100) / 100;

    if (course.teacher.email) {
      await this.mail.send({
        to: course.teacher.email,
        subject: `You earned ₹${teacherEarning} — ${course.title}`,
        html: `<p>Hi ${course.teacher.name},</p><p>A student just purchased <strong>${course.title}</strong>. Your earning: <strong>₹${teacherEarning}</strong>.</p>`,
      });
    }

    for (const email of adminEmails) {
      await this.mail.send({
        to: email,
        subject: `Platform commission ₹${platformCommission} — ${course.title}`,
        html: `<p>A purchase of <strong>${course.title}</strong> completed for ₹${purchaseAmount}. Teacher earning: ₹${teacherEarning}. Platform commission: <strong>₹${platformCommission}</strong>.</p>`,
      });
    }
  }
}
