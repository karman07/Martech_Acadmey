import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeListPrice, discounted } from '../common/pricing.util';
import { CourseNotificationsService } from '../mail/course-notifications.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseNotifications: CourseNotificationsService,
  ) {}

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

    let enrollment;
    try {
      enrollment = await this.prisma.enrollment.create({
        data: { userUid, courseId },
      });
    } catch {
      throw new ConflictException('Already enrolled');
    }
    await this.courseNotifications.notifyEnrollment(courseId, userUid);
    return enrollment;
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
    const enrollment = await this.requireEnrollment(userUid, courseId);

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

  async getLessonQuiz(userUid: string, courseId: string, lessonId: string) {
    const enrollment = await this.requireEnrollment(userUid, courseId);
    const lesson = await this.findQuizLesson(courseId, lessonId);

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
    });

    return {
      quizId: lesson.quiz!.id,
      title: lesson.quiz!.title,
      description: lesson.quiz!.description,
      questions: lesson.quiz!.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
      })),
      attempt: attempt
        ? this.scoreAttempt(lesson.quiz!.questions, attempt.answers, attempt)
        : null,
    };
  }

  async submitLessonQuiz(
    userUid: string,
    courseId: string,
    lessonId: string,
    answers: number[],
  ) {
    const enrollment = await this.requireEnrollment(userUid, courseId);
    const lesson = await this.findQuizLesson(courseId, lessonId);
    const questions = lesson.quiz!.questions;

    if (answers.length !== questions.length) {
      throw new BadRequestException(
        'Answer count does not match the number of questions',
      );
    }

    const score = questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctOptionIndex ? 1 : 0),
      0,
    );

    const attempt = await this.prisma.quizAttempt.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        quizId: lesson.quiz!.id,
        answers,
        score,
        totalQuestions: questions.length,
      },
      update: {
        answers,
        score,
        totalQuestions: questions.length,
        submittedAt: new Date(),
      },
    });

    await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      create: { enrollmentId: enrollment.id, lessonId },
      update: {},
    });

    return this.scoreAttempt(questions, answers, attempt);
  }

  private async requireEnrollment(userUid: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userUid_courseId: { userUid, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }
    return enrollment;
  }

  private async findQuizLesson(courseId: string, lessonId: string) {
    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
        quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.type !== 'quiz' || !lesson.quiz) {
      throw new NotFoundException('This lesson has no quiz');
    }
    return lesson;
  }

  private scoreAttempt(
    questions: { correctOptionIndex: number }[],
    answers: number[],
    attempt: { score: number; totalQuestions: number; submittedAt: Date },
  ) {
    return {
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      submittedAt: attempt.submittedAt,
      results: questions.map((q, i) => ({
        selectedOptionIndex: answers[i],
        correctOptionIndex: q.correctOptionIndex,
        isCorrect: answers[i] === q.correctOptionIndex,
      })),
    };
  }
}
