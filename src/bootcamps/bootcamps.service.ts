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
  courses: { select: { courseId: true } },
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
      instructor: { uid: bootcamp.teacher.uid, name: bootcamp.teacher.name },
      title: bootcamp.title,
      tagline: bootcamp.tagline,
      description: bootcamp.description,
      format: bootcamp.format,
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
      durationWeeks: bootcamp.durationWeeks,
      cohortSize: bootcamp.cohortSize,
      seatsRemaining: bootcamp.seatsRemaining,
      nextCohortDate: bootcamp.nextCohortDate,
      applicationDeadline: bootcamp.applicationDeadline,
      views: bootcamp.views,
      applications: bootcamp._count.applications,
      createdAt: bootcamp.createdAt,
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
        price: dto.price,
        discountPercent: dto.discountPercent ?? 0,
        durationWeeks: dto.durationWeeks,
        cohortSize: dto.cohortSize,
        seatsRemaining: dto.cohortSize,
        nextCohortDate: new Date(dto.nextCohortDate),
        applicationDeadline: new Date(dto.applicationDeadline),
        coverFrom: dto.coverFrom,
        coverTo: dto.coverTo,
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

  // -- Admin moderation --

  async findAllForAdmin(status?: string) {
    const bootcamps = await this.prisma.bootcamp.findMany({
      where: status ? { status: status as never } : undefined,
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bootcamps.map((b) => this.map(b));
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
