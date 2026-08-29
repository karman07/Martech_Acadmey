import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeListPrice, discounted } from '../common/pricing.util';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Free-course enrollment only — paid courses must go through /payments. */
  async enrollFree(userUid: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found');
    }

    const listPrice = computeListPrice(course.price, course.marginPercent);
    const finalPrice = discounted(listPrice, course.discountPercent);
    if (finalPrice > 0) {
      throw new BadRequestException(
        'This course requires payment — use /payments/order',
      );
    }

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: { userUid, courseId },
      });
      return enrollment;
    } catch {
      throw new ConflictException('Already enrolled');
    }
  }

  async findMine(userUid: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userUid },
      include: {
        course: {
          include: {
            modules: { include: { lessons: true } },
            category: true,
            teacher: true,
          },
        },
        progress: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => {
      const totalLessons = e.course.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0,
      );
      const totalDurationMin = e.course.modules.reduce(
        (sum, m) =>
          sum + m.lessons.reduce((s, l) => s + (l.durationMin ?? 0), 0),
        0,
      );
      const lastProgressAt = e.progress.reduce<Date | null>(
        (latest, p) =>
          !latest || p.completedAt > latest ? p.completedAt : latest,
        null,
      );
      return {
        courseId: e.courseId,
        courseSlug: e.course.slug,
        courseTitle: e.course.title,
        categoryName: e.course.category.name,
        level: e.course.level,
        coverFrom: e.course.coverFrom,
        coverTo: e.course.coverTo,
        coverImagePath: e.course.coverImagePath,
        instructorName: e.course.teacher.name,
        instructorAvatarPath: e.course.teacher.avatarPath,
        enrolledAt: e.enrolledAt,
        lastAccessedAt: lastProgressAt ?? e.enrolledAt,
        completedLessonIds: e.progress.map((p) => p.lessonId),
        totalLessons,
        totalDurationMin,
        progressPct:
          totalLessons > 0
            ? Math.round((e.progress.length / totalLessons) * 100)
            : 0,
      };
    });
  }

  async toggleLessonComplete(
    userUid: string,
    courseId: string,
    lessonId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userUid_courseId: { userUid, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
    });

    if (existing) {
      await this.prisma.lessonProgress.delete({ where: { id: existing.id } });
      return { completed: false };
    }

    await this.prisma.lessonProgress.create({
      data: { enrollmentId: enrollment.id, lessonId },
    });
    return { completed: true };
  }
}
