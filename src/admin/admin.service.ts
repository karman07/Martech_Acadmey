import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { EbooksService } from '../ebooks/ebooks.service';
import { BootcampsService } from '../bootcamps/bootcamps.service';
import { BundlesService } from '../bundles/bundles.service';
import { lastNMonths, monthKey } from '../common/date.util';

export type ContentType = 'courses' | 'ebooks' | 'bootcamps' | 'bundles';

const CONTENT_STATUSES = ['draft', 'pending_review', 'published', 'rejected'] as const;

function statusCounts<T extends { status: string; _count: { status: number } }>(
  rows: T[],
): Record<(typeof CONTENT_STATUSES)[number], number> {
  const base = { draft: 0, pending_review: 0, published: 0, rejected: 0 };
  for (const row of rows) {
    base[row.status as (typeof CONTENT_STATUSES)[number]] = row._count.status;
  }
  return base;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
    private readonly ebooksService: EbooksService,
    private readonly bootcampsService: BootcampsService,
    private readonly bundlesService: BundlesService,
  ) {}

  private serviceFor(type: ContentType) {
    switch (type) {
      case 'courses':
        return this.coursesService;
      case 'ebooks':
        return this.ebooksService;
      case 'bootcamps':
        return this.bootcampsService;
      case 'bundles':
        return this.bundlesService;
      default:
        throw new BadRequestException('Unknown content type');
    }
  }

  async findAllContent(status?: string, contentType?: ContentType) {
    // When the admin is only looking at one tab (the common case), skip computing the
    // other three content types entirely instead of fetching everything and discarding
    // most of it — this was the main reason the content-review list was slow to load.
    if (contentType) {
      const items = await this.serviceFor(contentType).findAllForAdmin(status);
      return items.map((item) => ({ ...item, contentType }));
    }

    const [courses, ebooks, bootcamps, bundles] = await Promise.all([
      this.coursesService.findAllForAdmin(status),
      this.ebooksService.findAllForAdmin(status),
      this.bootcampsService.findAllForAdmin(status),
      this.bundlesService.findAllForAdmin(status),
    ]);

    return [
      ...courses.map((c) => ({ ...c, contentType: 'courses' as const })),
      ...ebooks.map((e) => ({ ...e, contentType: 'ebooks' as const })),
      ...bootcamps.map((b) => ({ ...b, contentType: 'bootcamps' as const })),
      ...bundles.map((b) => ({ ...b, contentType: 'bundles' as const })),
    ];
  }

  approve(type: ContentType, id: string, marginPercent: number) {
    return this.serviceFor(type).approve(id, marginPercent);
  }

  reject(type: ContentType, id: string, reason: string) {
    return this.serviceFor(type).reject(id, reason);
  }

  setMargin(type: ContentType, id: string, marginPercent: number) {
    return this.serviceFor(type).setMargin(id, marginPercent);
  }

  findUsers(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as never } : undefined,
      include: { kyc: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findUserDetail(uid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uid },
      include: {
        kyc: true,
        courses: { orderBy: { createdAt: 'desc' } },
        ebooks: { orderBy: { createdAt: 'desc' } },
        bootcamps: { orderBy: { createdAt: 'desc' } },
        bundles: { orderBy: { createdAt: 'desc' } },
        payouts: { orderBy: { createdAt: 'desc' } },
        enrollments: {
          orderBy: { enrolledAt: 'desc' },
          include: { course: { select: { title: true, slug: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      students,
      teachers,
      admins,
      newLast30Days,
      courseCounts,
      ebookCounts,
      bootcampCounts,
      bundleCounts,
      pendingKycCount,
      gmvAgg,
      payoutsAgg,
      purchases,
      enrollments,
      recentSignups,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'student' } }),
      this.prisma.user.count({ where: { role: 'teacher' } }),
      this.prisma.user.count({ where: { role: 'admin' } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.ebook.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.bootcamp.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.bundle.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.kyc.count({ where: { status: 'pending' } }),
      this.prisma.purchase.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      this.prisma.payout.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      this.prisma.purchase.findMany({
        where: { status: 'paid' },
        select: { amount: true, createdAt: true },
      }),
      this.prisma.enrollment.findMany({ select: { enrolledAt: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { uid: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const months = lastNMonths(12);
    const byMonth = new Map(months.map((m) => [m.key, { month: m.label, gmv: 0, enrollments: 0 }]));

    for (const purchase of purchases) {
      const bucket = byMonth.get(monthKey(purchase.createdAt));
      if (bucket) bucket.gmv += purchase.amount.toNumber();
    }
    for (const enrollment of enrollments) {
      const bucket = byMonth.get(monthKey(enrollment.enrolledAt));
      if (bucket) bucket.enrollments += 1;
    }

    return {
      users: { total: totalUsers, students, teachers, admins, newLast30Days },
      content: {
        courses: statusCounts(courseCounts),
        ebooks: statusCounts(ebookCounts),
        bootcamps: statusCounts(bootcampCounts),
        bundles: statusCounts(bundleCounts),
      },
      pendingContentCount:
        statusCounts(courseCounts).pending_review +
        statusCounts(ebookCounts).pending_review +
        statusCounts(bootcampCounts).pending_review +
        statusCounts(bundleCounts).pending_review,
      pendingKycCount,
      revenue: {
        totalGMV: gmvAgg._sum.amount?.toNumber() ?? 0,
        totalPayoutsPaid: payoutsAgg._sum.amount?.toNumber() ?? 0,
        months: months.map((m) => byMonth.get(m.key)),
      },
      recentSignups,
    };
  }
}
