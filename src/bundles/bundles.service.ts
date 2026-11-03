import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeListPrice, discounted, slugify } from '../common/pricing.util';
import { CoverImageStorage } from '../common/cover-image.storage';
import type { UploadedCoverFile } from '../common/cover-image.storage';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

const FULL_INCLUDE = {
  teacher: true,
  category: true,
  courses: {
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          level: true,
          price: true,
          discountPercent: true,
          marginPercent: true,
          coverFrom: true,
          coverTo: true,
          coverImagePath: true,
        },
      },
    },
  },
  _count: { select: { purchases: true } },
};

type BundleWithRelations = Prisma.BundleGetPayload<{
  include: typeof FULL_INCLUDE;
}>;

@Injectable()
export class BundlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverStorage: CoverImageStorage,
  ) {}

  private map(bundle: BundleWithRelations) {
    const listPrice = computeListPrice(bundle.price, bundle.marginPercent);
    return {
      id: bundle.id,
      slug: bundle.slug,
      teacherUid: bundle.teacherUid,
      instructor: {
        uid: bundle.teacher.uid,
        name: bundle.teacher.name,
        title: bundle.teacher.expertise ?? null,
        bio: bundle.teacher.bio ?? null,
        avatarPath: bundle.teacher.avatarPath ?? null,
      },
      title: bundle.title,
      tagline: bundle.tagline,
      description: bundle.description,
      courseIds: bundle.courses.map((c) => c.courseId),
      courses: bundle.courses.map((c) => {
        const courseListPrice = computeListPrice(
          c.course.price,
          c.course.marginPercent,
        );
        return {
          id: c.course.id,
          slug: c.course.slug,
          title: c.course.title,
          summary: c.course.summary,
          level: c.course.level,
          coverTheme: { from: c.course.coverFrom, to: c.course.coverTo },
          coverImagePath: c.course.coverImagePath,
          listPrice: courseListPrice,
          finalPrice: discounted(courseListPrice, c.course.discountPercent),
        };
      }),
      price: bundle.price.toNumber(),
      discountPercent: bundle.discountPercent,
      marginPercent: bundle.marginPercent,
      listPrice,
      finalPrice: discounted(listPrice, bundle.discountPercent),
      status: bundle.status,
      rejectionReason: bundle.rejectionReason,
      coverTheme: { from: bundle.coverFrom, to: bundle.coverTo },
      coverImagePath: bundle.coverImagePath,
      views: bundle.views,
      purchases: bundle._count.purchases,
      students: bundle._count.purchases,
      createdAt: bundle.createdAt,
      categorySlug: bundle.categorySlug,
      categoryName: bundle.category?.name ?? null,
      level: bundle.level,
      rating: bundle.rating,
      badge: bundle.badge,
      highlights: bundle.highlights,
      audience: bundle.audience,
    };
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (
      await this.prisma.bundle.findUnique({ where: { slug: candidate } })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async assertCoursesOwned(teacherUid: string, courseIds: string[]) {
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
    });
    if (courses.length !== courseIds.length) {
      throw new BadRequestException('One or more courses were not found');
    }
    const invalid = courses.some(
      (c) => c.teacherUid !== teacherUid || c.status !== 'published',
    );
    if (invalid) {
      throw new BadRequestException(
        'Bundles can only include your own published courses',
      );
    }
  }

  async create(teacherUid: string, dto: CreateBundleDto) {
    await this.assertCoursesOwned(teacherUid, dto.courseIds);

    const bundle = await this.prisma.bundle.create({
      data: {
        teacherUid,
        slug: await this.uniqueSlug(dto.title),
        title: dto.title,
        tagline: dto.tagline ?? '',
        description: dto.description,
        price: dto.price,
        discountPercent: dto.discountPercent ?? 0,
        coverFrom: dto.coverFrom,
        coverTo: dto.coverTo,
        categorySlug: dto.categorySlug,
        level: dto.level,
        badge: dto.badge,
        highlights: dto.highlights ?? [],
        audience: dto.audience ?? '',
        courses: {
          createMany: { data: dto.courseIds.map((courseId) => ({ courseId })) },
        },
      },
      include: FULL_INCLUDE,
    });
    return this.map(bundle);
  }

  async findAllForTeacher(teacherUid: string) {
    const bundles = await this.prisma.bundle.findMany({
      where: { teacherUid },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bundles.map((b) => this.map(b));
  }

  private async findRawOrThrow(id: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return bundle;
  }

  private async assertOwned(teacherUid: string, id: string) {
    const bundle = await this.findRawOrThrow(id);
    if (bundle.teacherUid !== teacherUid) {
      throw new ForbiddenException('Not your bundle');
    }
    return bundle;
  }

  async findOneForTeacher(teacherUid: string, id: string) {
    return this.map(await this.assertOwned(teacherUid, id));
  }

  async update(teacherUid: string, id: string, dto: UpdateBundleDto) {
    await this.assertOwned(teacherUid, id);
    if (dto.courseIds) {
      await this.assertCoursesOwned(teacherUid, dto.courseIds);
    }

    const { courseIds, ...rest } = dto;
    const bundle = await this.prisma.bundle.update({
      where: { id },
      data: {
        ...rest,
        status: 'draft',
        rejectionReason: null,
        ...(courseIds
          ? {
              courses: {
                deleteMany: {},
                createMany: {
                  data: courseIds.map((courseId) => ({ courseId })),
                },
              },
            }
          : {}),
      },
      include: FULL_INCLUDE,
    });
    return this.map(bundle);
  }

  async submit(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    const bundle = await this.prisma.bundle.update({
      where: { id },
      data: { status: 'pending_review', rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(bundle);
  }

  async uploadCover(
    teacherUid: string,
    id: string,
    file: UploadedCoverFile | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Cover must be an image file');
    }

    const bundle = await this.assertOwned(teacherUid, id);
    await this.coverStorage.delete(bundle.coverImagePath);
    const stored = await this.coverStorage.save('bundles', teacherUid, file);

    const updated = await this.prisma.bundle.update({
      where: { id },
      data: { coverImagePath: stored.storagePath },
      include: FULL_INCLUDE,
    });
    return this.map(updated);
  }

  async findPublished() {
    const bundles = await this.prisma.bundle.findMany({
      where: { status: 'published' },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bundles.map((b) => this.map(b));
  }

  async findPublishedBySlug(slug: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { slug },
      include: FULL_INCLUDE,
    });
    if (!bundle || bundle.status !== 'published') {
      throw new NotFoundException('Bundle not found');
    }
    await this.prisma.bundle.update({
      where: { id: bundle.id },
      data: { views: { increment: 1 } },
    });
    return this.map({ ...bundle, views: bundle.views + 1 });
  }

  async findMine(userUid: string) {
    const purchases = await this.prisma.bundlePurchase.findMany({
      where: { userUid },
      include: { bundle: { include: FULL_INCLUDE } },
      orderBy: { purchasedAt: 'desc' },
    });
    return purchases.map((p) => ({
      ...this.map(p.bundle),
      purchasedAt: p.purchasedAt,
    }));
  }

  // -- Admin moderation --

  /** Lightweight row projection for the admin content-review list — skips the nested
   * included-courses list, which the list row never renders. */
  async findAllForAdmin(status?: string) {
    const bundles = await this.prisma.bundle.findMany({
      where: status ? { status: status as never } : undefined,
      select: {
        id: true,
        title: true,
        price: true,
        discountPercent: true,
        marginPercent: true,
        status: true,
        rejectionReason: true,
        coverFrom: true,
        coverTo: true,
        coverImagePath: true,
        category: { select: { name: true } },
        teacher: { select: { uid: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return bundles.map((b) => {
      const listPrice = computeListPrice(b.price, b.marginPercent);
      return {
        id: b.id,
        title: b.title,
        category: b.category?.name ?? null,
        instructor: { uid: b.teacher.uid, name: b.teacher.name },
        price: b.price.toNumber(),
        marginPercent: b.marginPercent,
        finalPrice: discounted(listPrice, b.discountPercent),
        status: b.status,
        rejectionReason: b.rejectionReason,
        coverTheme: { from: b.coverFrom, to: b.coverTo },
        coverImagePath: b.coverImagePath,
      };
    });
  }

  async approve(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const bundle = await this.prisma.bundle.update({
      where: { id },
      data: { status: 'published', marginPercent, rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(bundle);
  }

  async reject(id: string, reason: string) {
    await this.findRawOrThrow(id);
    const bundle = await this.prisma.bundle.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
      include: FULL_INCLUDE,
    });
    return this.map(bundle);
  }

  async setMargin(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const bundle = await this.prisma.bundle.update({
      where: { id },
      data: { marginPercent },
      include: FULL_INCLUDE,
    });
    return this.map(bundle);
  }
}
