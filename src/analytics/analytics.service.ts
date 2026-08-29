import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { lastNMonths, monthKey } from '../common/date.util';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForTeacher(teacherUid: string) {
    const [courses, ebooks, bootcamps, bundles] = await Promise.all([
      this.prisma.course.findMany({ where: { teacherUid }, select: { id: true, views: true } }),
      this.prisma.ebook.findMany({ where: { teacherUid }, select: { id: true, views: true } }),
      this.prisma.bootcamp.findMany({ where: { teacherUid }, select: { id: true, views: true } }),
      this.prisma.bundle.findMany({ where: { teacherUid }, select: { id: true, views: true } }),
    ]);

    const courseIds = courses.map((c) => c.id);
    const totalViews =
      sum(courses, 'views') + sum(ebooks, 'views') + sum(bootcamps, 'views') + sum(bundles, 'views');

    const purchases = await this.prisma.purchase.findMany({
      where: {
        status: 'paid',
        OR: [
          { type: 'course', refId: { in: courseIds } },
          { type: 'ebook', refId: { in: ebooks.map((e) => e.id) } },
          { type: 'bootcamp', refId: { in: bootcamps.map((b) => b.id) } },
          { type: 'bundle', refId: { in: bundles.map((b) => b.id) } },
        ],
      },
      select: { amount: true, createdAt: true },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { enrolledAt: true },
    });

    const months = lastNMonths(12);
    const byMonth = new Map(months.map((m) => [m.key, { month: m.label, revenue: 0, enrollments: 0 }]));

    for (const purchase of purchases) {
      const bucket = byMonth.get(monthKey(purchase.createdAt));
      if (bucket) bucket.revenue += purchase.amount.toNumber();
    }
    for (const enrollment of enrollments) {
      const bucket = byMonth.get(monthKey(enrollment.enrolledAt));
      if (bucket) bucket.enrollments += 1;
    }

    return {
      totalViews,
      months: months.map((m) => byMonth.get(m.key)),
    };
  }
}

function sum(rows: { views: number }[], key: 'views') {
  return rows.reduce((total, row) => total + row[key], 0);
}
