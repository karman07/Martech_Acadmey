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
import { CreateBootcampDto } from './dto/create-bootcamp.dto';
import { UpdateBootcampDto } from './dto/update-bootcamp.dto';

const FULL_INCLUDE = {
  teacher: true,
  category: true,
  courses: { select: { courseId: true } },
  liveClasses: {
    include: { liveClass: true },
    orderBy: { liveClass: { dateISO: 'asc' as const } },
  },
  _count: { select: { applications: true } },
};

type BootcampWithRelations = Prisma.BootcampGetPayload<{
  include: typeof FULL_INCLUDE;
}>;

@Injectable()
export class BootcampsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverStorage: CoverImageStorage,
  ) {}

  private map(bootcamp: BootcampWithRelations) {
    const listPrice = computeListPrice(bootcamp.price, bootcamp.marginPercent);
    return {
      id: bootcamp.id,
      slug: bootcamp.slug,
      teacherUid: bootcamp.teacherUid,
      instructor: {
        uid: bootcamp.teacher.uid,
        name: bootcamp.teacher.name,
        title: bootcamp.teacher.expertise ?? null,
        bio: bootcamp.teacher.bio ?? null,
        avatarPath: bootcamp.teacher.avatarPath ?? null,
      },
      title: bootcamp.title,
      tagline: bootcamp.tagline,
      description: bootcamp.description,
      format: bootcamp.format,
      location: bootcamp.location,
      price: bootcamp.price.toNumber(),
      discountPercent: bootcamp.discountPercent,
      marginPercent: bootcamp.marginPercent,
      listPrice,
      finalPrice: discounted(listPrice, bootcamp.discountPercent),
      status: bootcamp.status,
      rejectionReason: bootcamp.rejectionReason,
      coverTheme: { from: bootcamp.coverFrom, to: bootcamp.coverTo },
      coverImagePath: bootcamp.coverImagePath,
      courseIds: bootcamp.courses.map((c) => c.courseId),
      // Public-safe summary — no join/recording links here. findMine() (enrolled students
      // only) overrides this with the full details after calling map().
      liveClasses: bootcamp.liveClasses.map((link) => ({
        id: link.liveClass.id,
        title: link.liveClass.title,
        dateISO: link.liveClass.dateISO,
        durationMinutes: link.liveClass.durationMinutes,
        status: link.liveClass.status,
      })),
      durationWeeks: bootcamp.durationWeeks,
      cohortSize: bootcamp.cohortSize,
      seatsRemaining: bootcamp.seatsRemaining,
      nextCohortDate: bootcamp.nextCohortDate,
      applicationDeadline: bootcamp.applicationDeadline,
      views: bootcamp.views,
      applications: bootcamp._count.applications,
      createdAt: bootcamp.createdAt,
      categorySlug: bootcamp.categorySlug,
      categoryName: bootcamp.category?.name ?? null,
      level: bootcamp.level,
      hoursPerWeek: bootcamp.hoursPerWeek,
      rating: bootcamp.rating,
      studentsGraduated: bootcamp.studentsGraduated,
      outcomes: bootcamp.outcomes,
      modules: bootcamp.modules,
      admissionRequirements: bootcamp.admissionRequirements,
      careerSupport: bootcamp.careerSupport,
    };
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (
      await this.prisma.bootcamp.findUnique({ where: { slug: candidate } })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(teacherUid: string, dto: CreateBootcampDto) {
    const bootcamp = await this.prisma.bootcamp.create({
      data: {
        teacherUid,
        slug: await this.uniqueSlug(dto.title),
        title: dto.title,
        tagline: dto.tagline,
        description: dto.description,
        format: dto.format,
        location: dto.location,
        price: dto.price,
        discountPercent: dto.discountPercent ?? 0,
        durationWeeks: dto.durationWeeks,
        cohortSize: dto.cohortSize,
        seatsRemaining: dto.cohortSize,
        nextCohortDate: new Date(dto.nextCohortDate),
        applicationDeadline: new Date(dto.applicationDeadline),
        coverFrom: dto.coverFrom,
        coverTo: dto.coverTo,
        categorySlug: dto.categorySlug,
        level: dto.level,
        hoursPerWeek: dto.hoursPerWeek ?? 0,
        outcomes: dto.outcomes ?? [],
        modules: dto.modules ?? [],
        admissionRequirements: dto.admissionRequirements ?? [],
        careerSupport: dto.careerSupport ?? [],
      },
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
  }

  async findAllForTeacher(teacherUid: string) {
    const bootcamps = await this.prisma.bootcamp.findMany({
      where: { teacherUid },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bootcamps.map((b) => this.map(b));
  }

  private async findRawOrThrow(id: string) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!bootcamp) throw new NotFoundException('Bootcamp not found');
    return bootcamp;
  }

  private async assertOwned(teacherUid: string, id: string) {
    const bootcamp = await this.findRawOrThrow(id);
    if (bootcamp.teacherUid !== teacherUid) {
      throw new ForbiddenException('Not your bootcamp');
    }
    return bootcamp;
  }

  async findOneForTeacher(teacherUid: string, id: string) {
    return this.map(await this.assertOwned(teacherUid, id));
  }

  async update(teacherUid: string, id: string, dto: UpdateBootcampDto) {
    await this.assertOwned(teacherUid, id);
    const data: Prisma.BootcampUpdateInput = {
      ...dto,
      status: 'draft',
      rejectionReason: null,
      nextCohortDate: dto.nextCohortDate
        ? new Date(dto.nextCohortDate)
        : undefined,
      applicationDeadline: dto.applicationDeadline
        ? new Date(dto.applicationDeadline)
        : undefined,
    };
    if (dto.cohortSize !== undefined) {
      data.seatsRemaining = dto.cohortSize;
    }
    const bootcamp = await this.prisma.bootcamp.update({
      where: { id },
      data,
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
  }

  async submit(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    const bootcamp = await this.prisma.bootcamp.update({
      where: { id },
      data: { status: 'pending_review', rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
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

    const bootcamp = await this.assertOwned(teacherUid, id);
    await this.coverStorage.delete(bootcamp.coverImagePath);
    const stored = await this.coverStorage.save('bootcamps', teacherUid, file);

    const updated = await this.prisma.bootcamp.update({
      where: { id },
      data: { coverImagePath: stored.storagePath },
      include: FULL_INCLUDE,
    });
    return this.map(updated);
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.bootcampCourse.findUnique({
      where: { bootcampId_courseId: { bootcampId: id, courseId } },
    });

    if (existing) {
      await this.prisma.bootcampCourse.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.bootcampCourse.create({
        data: { bootcampId: id, courseId },
      });
    }

    const bootcamp = await this.prisma.bootcamp.findUniqueOrThrow({
      where: { id },
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
  }

  async findPublished(teacherUid?: string) {
    const bootcamps = await this.prisma.bootcamp.findMany({
      where: { status: 'published', teacherUid },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bootcamps.map((b) => this.map(b));
  }

  async findPublishedBySlug(slug: string) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { slug },
      include: FULL_INCLUDE,
    });
    if (!bootcamp || bootcamp.status !== 'published') {
      throw new NotFoundException('Bootcamp not found');
    }
    await this.prisma.bootcamp.update({
      where: { id: bootcamp.id },
      data: { views: { increment: 1 } },
    });
    return this.map({ ...bootcamp, views: bootcamp.views + 1 });
  }

  /** Enrolled-student view — unlike the base map()'s public-safe live-class summary, this
   * includes the join link and recording, since only students who've paid to apply see this. */
  async findMine(userUid: string) {
    const applications = await this.prisma.bootcampApplication.findMany({
      where: { userUid },
      include: { bootcamp: { include: FULL_INCLUDE } },
      orderBy: { appliedAt: 'desc' },
    });
    return applications.map((a) => ({
      ...this.map(a.bootcamp),
      liveClasses: a.bootcamp.liveClasses.map((link) => ({
        id: link.liveClass.id,
        title: link.liveClass.title,
        description: link.liveClass.description,
        dateISO: link.liveClass.dateISO,
        durationMinutes: link.liveClass.durationMinutes,
        status: link.liveClass.status,
        url: link.liveClass.url,
        recordingUrl: link.liveClass.recordingUrl,
      })),
      appliedAt: a.appliedAt,
    }));
  }

  // -- Admin moderation --

  /** Lightweight row projection for the admin content-review list — skips description/
   * cohort/schedule details, which the list row never renders. */
  async findAllForAdmin(status?: string) {
    const bootcamps = await this.prisma.bootcamp.findMany({
      where: status ? { status: status as never } : undefined,
      select: {
        id: true,
        title: true,
        format: true,
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
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return bootcamps.map((b) => {
      const listPrice = computeListPrice(b.price, b.marginPercent);
      return {
        id: b.id,
        title: b.title,
        category: b.category?.name ?? null,
        format: b.format,
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
    const bootcamp = await this.prisma.bootcamp.update({
      where: { id },
      data: { status: 'published', marginPercent, rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
  }

  async reject(id: string, reason: string) {
    await this.findRawOrThrow(id);
    const bootcamp = await this.prisma.bootcamp.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
  }

  async setMargin(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const bootcamp = await this.prisma.bootcamp.update({
      where: { id },
      data: { marginPercent },
      include: FULL_INCLUDE,
    });
    return this.map(bootcamp);
  }
}
