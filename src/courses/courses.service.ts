import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeListPrice, discounted, slugify } from '../common/pricing.util';
import { CoverImageStorage } from '../common/cover-image.storage';
import type { UploadedCoverFile } from '../common/cover-image.storage';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
} from './dto/course-module.dto';
import {
  CreateCourseLessonDto,
  UpdateCourseLessonDto,
} from './dto/course-lesson.dto';
import { CreateReviewDto } from './dto/review.dto';

const FULL_INCLUDE = {
  category: true,
  modules: {
    include: { lessons: { orderBy: { order: 'asc' as const } } },
    orderBy: { order: 'asc' as const },
  },
  teacher: true,
  _count: { select: { enrollments: true, reviews: true } },
  reviews: { select: { rating: true } },
};

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: typeof FULL_INCLUDE;
}>;

/** Richer include used only for admin content review — adds quiz question counts and course-level library-attachment counts (assignments, activities, quizzes, ebooks, live classes) on top of the base curriculum structure. */
const ADMIN_INCLUDE = {
  ...FULL_INCLUDE,
  _count: {
    select: {
      enrollments: true,
      reviews: true,
      assignmentLinks: true,
      activityLinks: true,
      quizLinks: true,
      libraryEbookLinks: true,
      liveClassLinks: true,
    },
  },
  modules: {
    include: {
      lessons: {
        include: {
          quiz: { include: { _count: { select: { questions: true } } } },
        },
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { order: 'asc' as const },
  },
};

type CourseWithAdminRelations = Prisma.CourseGetPayload<{
  include: typeof ADMIN_INCLUDE;
}>;

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverStorage: CoverImageStorage,
  ) {}

  private map(course: CourseWithRelations) {
    const listPrice = computeListPrice(course.price, course.marginPercent);
    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
          course.reviews.length
        : 0;

    return {
      id: course.id,
      slug: course.slug,
      teacherUid: course.teacherUid,
      instructor: {
        uid: course.teacher.uid,
        name: course.teacher.name,
        title: course.teacher.expertise ?? null,
        bio: course.teacher.bio ?? null,
        avatarPath: course.teacher.avatarPath ?? null,
      },
      title: course.title,
      summary: course.summary,
      description: course.description,
      descriptionWidth: course.descriptionWidth,
      previewVideoUrl: course.previewVideoUrl,
      category: course.category.slug,
      categoryName: course.category.name,
      level: course.level,
      price: course.price.toNumber(),
      discountPercent: course.discountPercent,
      marginPercent: course.marginPercent,
      listPrice,
      finalPrice: discounted(listPrice, course.discountPercent),
      status: course.status,
      rejectionReason: course.rejectionReason,
      coverTheme: { from: course.coverFrom, to: course.coverTo },
      coverImagePath: course.coverImagePath,
      courseTemplate: course.courseTemplate,
      courseAccent: course.courseAccent,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: course.reviews.length,
      studentsEnrolled: course._count.enrollments,
      views: course.views,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationMin: l.durationMin,
          url: l.url,
          mediaId: l.mediaId,
          quizId: l.quizId,
          order: l.order,
        })),
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  private mapForAdmin(course: CourseWithAdminRelations) {
    return {
      ...this.map(course),
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationMin: l.durationMin,
          order: l.order,
          quizQuestionCount: l.quiz ? l.quiz._count.questions : null,
        })),
      })),
      contentCounts: {
        lessons: course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
        assignments: course._count.assignmentLinks,
        activities: course._count.activityLinks,
        quizzes: course._count.quizLinks,
        libraryEbooks: course._count.libraryEbookLinks,
        liveClasses: course._count.liveClassLinks,
      },
    };
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (
      await this.prisma.course.findUnique({ where: { slug: candidate } })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(teacherUid: string, dto: CreateCourseDto) {
    const category = await this.prisma.category.findUnique({
      where: { slug: dto.categorySlug },
    });
    if (!category) {
      throw new BadRequestException('Unknown category');
    }

    const course = await this.prisma.course.create({
      data: {
        teacherUid,
        slug: await this.uniqueSlug(dto.title),
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
        descriptionWidth: dto.descriptionWidth,
        previewVideoUrl: dto.previewVideoUrl ?? null,
        categorySlug: dto.categorySlug,
        level: dto.level,
        price: dto.price,
        discountPercent: dto.discountPercent ?? 0,
        coverFrom: dto.coverFrom,
        coverTo: dto.coverTo,
      },
      include: FULL_INCLUDE,
    });

    return this.map(course);
  }

  async findAllForTeacher(teacherUid: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherUid },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => this.map(c));
  }

  private async findRawOrThrow(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async findOneForTeacher(teacherUid: string, id: string) {
    const course = await this.findRawOrThrow(id);
    if (course.teacherUid !== teacherUid) {
      throw new ForbiddenException('Not your course');
    }
    return this.map(course);
  }

  async getStudentProgress(teacherUid: string, id: string) {
    const course = await this.assertOwnedEditable(teacherUid, id);
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: id },
      include: {
        user: { select: { uid: true, name: true, avatarPath: true } },
        progress: { select: { lessonId: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const students = enrollments.map((e) => {
      const completedLessons = e.progress.length;
      const progressPct =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
      return {
        userUid: e.user.uid,
        name: e.user.name,
        avatarPath: e.user.avatarPath,
        enrolledAt: e.enrolledAt,
        completedLessons,
        progressPct,
      };
    });

    const averageProgressPct =
      students.length > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.progressPct, 0) /
              students.length,
          )
        : 0;
    const completedCount = students.filter((s) => s.progressPct === 100).length;

    return {
      totalLessons,
      studentsEnrolled: students.length,
      averageProgressPct,
      completedCount,
      students,
    };
  }

  private async assertOwnedEditable(teacherUid: string, id: string) {
    const course = await this.findRawOrThrow(id);
    if (course.teacherUid !== teacherUid) {
      throw new ForbiddenException('Not your course');
    }
    return course;
  }

  async update(teacherUid: string, id: string, dto: UpdateCourseDto) {
    await this.assertOwnedEditable(teacherUid, id);

    if (dto.categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.categorySlug },
      });
      if (!category) {
        throw new BadRequestException('Unknown category');
      }
    }

    // Picking a page layout or accent color is purely cosmetic — unlike
    // every other editable field here, it shouldn't unpublish a live course
    // or force it back through review.
    const COSMETIC_FIELDS = new Set(['courseTemplate', 'courseAccent']);
    const isCosmeticOnly = Object.keys(dto).every((key) =>
      COSMETIC_FIELDS.has(key),
    );

    const course = await this.prisma.course.update({
      where: { id },
      data: isCosmeticOnly
        ? { ...dto }
        : { ...dto, status: 'draft', rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(course);
  }

  async submit(teacherUid: string, id: string) {
    const course = await this.assertOwnedEditable(teacherUid, id);
    if (course.modules.length === 0) {
      throw new BadRequestException(
        'Add at least one module before submitting for review',
      );
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: { status: 'pending_review', rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(updated);
  }

  async addModule(
    teacherUid: string,
    courseId: string,
    dto: CreateCourseModuleDto,
  ) {
    await this.assertOwnedEditable(teacherUid, courseId);
    const count = await this.prisma.courseModule.count({ where: { courseId } });
    await this.prisma.courseModule.create({
      data: { courseId, title: dto.title, order: dto.order ?? count },
    });
    return this.findOneForTeacher(teacherUid, courseId);
  }

  async updateModule(
    teacherUid: string,
    courseId: string,
    moduleId: string,
    dto: UpdateCourseModuleDto,
  ) {
    await this.assertModuleOwned(teacherUid, courseId, moduleId);
    await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: dto,
    });
    return this.findOneForTeacher(teacherUid, courseId);
  }

  async removeModule(teacherUid: string, courseId: string, moduleId: string) {
    await this.assertModuleOwned(teacherUid, courseId, moduleId);
    await this.prisma.courseModule.delete({ where: { id: moduleId } });
    return this.findOneForTeacher(teacherUid, courseId);
  }

  private async assertModuleOwned(
    teacherUid: string,
    courseId: string,
    moduleId: string,
  ) {
    await this.assertOwnedEditable(teacherUid, courseId);
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
    });
    if (!module || module.courseId !== courseId) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  async addLesson(
    teacherUid: string,
    courseId: string,
    moduleId: string,
    dto: CreateCourseLessonDto,
  ) {
    await this.assertModuleOwned(teacherUid, courseId, moduleId);
    await this.assertMediaOwned(teacherUid, dto.mediaId);
    await this.assertQuizOwned(teacherUid, dto.quizId);
    const count = await this.prisma.courseLesson.count({ where: { moduleId } });
    await this.prisma.courseLesson.create({
      data: {
        moduleId,
        title: dto.title,
        type: dto.type as never,
        durationMin: dto.durationMin,
        url: dto.url,
        mediaId: dto.mediaId,
        quizId: dto.quizId,
        order: dto.order ?? count,
      },
    });
    return this.findOneForTeacher(teacherUid, courseId);
  }

  async updateLesson(
    teacherUid: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
    dto: UpdateCourseLessonDto,
  ) {
    await this.assertModuleOwned(teacherUid, courseId, moduleId);
    await this.assertMediaOwned(teacherUid, dto.mediaId);
    await this.assertQuizOwned(teacherUid, dto.quizId);
    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || lesson.moduleId !== moduleId) {
      throw new NotFoundException('Lesson not found');
    }
    await this.prisma.courseLesson.update({
      where: { id: lessonId },
      data: { ...dto, type: dto.type as never },
    });
    return this.findOneForTeacher(teacherUid, courseId);
  }

  async removeLesson(
    teacherUid: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ) {
    await this.assertModuleOwned(teacherUid, courseId, moduleId);
    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || lesson.moduleId !== moduleId) {
      throw new NotFoundException('Lesson not found');
    }
    await this.prisma.courseLesson.delete({ where: { id: lessonId } });
    return this.findOneForTeacher(teacherUid, courseId);
  }

  private async assertMediaOwned(
    teacherUid: string,
    mediaId: string | null | undefined,
  ) {
    if (!mediaId) return;
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });
    if (!media || media.teacherUid !== teacherUid) {
      throw new BadRequestException('Media asset not found');
    }
  }

  private async assertQuizOwned(
    teacherUid: string,
    quizId: string | null | undefined,
  ) {
    if (!quizId) return;
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz || quiz.teacherUid !== teacherUid) {
      throw new BadRequestException('Quiz not found');
    }
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

    const course = await this.assertOwnedEditable(teacherUid, id);
    await this.coverStorage.delete(course.coverImagePath);
    const stored = await this.coverStorage.save('courses', teacherUid, file);

    const updated = await this.prisma.course.update({
      where: { id },
      data: { coverImagePath: stored.storagePath },
      include: FULL_INCLUDE,
    });
    return this.map(updated);
  }

  async findPublished(filters: {
    category?: string;
    teacherUid?: string;
    level?: string;
  }) {
    const courses = await this.prisma.course.findMany({
      where: {
        status: 'published',
        categorySlug: filters.category,
        teacherUid: filters.teacherUid,
        level: filters.level,
      },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => this.map(c));
  }

  async findPublishedBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: FULL_INCLUDE,
    });
    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found');
    }
    await this.prisma.course.update({
      where: { id: course.id },
      data: { views: { increment: 1 } },
    });
    return this.map({ ...course, views: course.views + 1 });
  }

  async addReview(userUid: string, slug: string, dto: CreateReviewDto) {
    const course = await this.prisma.course.findUnique({ where: { slug } });
    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userUid_courseId: { userUid, courseId: course.id } },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'Enroll in this course before leaving a review',
      );
    }

    try {
      await this.prisma.review.upsert({
        where: { userUid_courseId: { userUid, courseId: course.id } },
        update: { rating: dto.rating, comment: dto.comment },
        create: {
          userUid,
          courseId: course.id,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    } catch {
      throw new ConflictException('Could not save review');
    }

    return this.findPublishedBySlug(slug);
  }

  async findInstructors() {
    const teachers = await this.prisma.user.findMany({
      where: {
        role: 'teacher',
        OR: [
          { courses: { some: { status: 'published' } } },
          { ebooks: { some: { status: 'published' } } },
          { bootcamps: { some: { status: 'published' } } },
        ],
      },
    });

    return Promise.all(teachers.map((t) => this.mapInstructor(t.uid)));
  }

  async findInstructorByUid(uid: string) {
    const teacher = await this.prisma.user.findUnique({ where: { uid } });
    if (!teacher || teacher.role !== 'teacher') {
      throw new NotFoundException('Instructor not found');
    }
    return this.mapInstructor(uid);
  }

  private async mapInstructor(uid: string) {
    const teacher = await this.prisma.user.findUniqueOrThrow({
      where: { uid },
    });
    const [studentCount, reviews] = await Promise.all([
      this.prisma.enrollment.count({ where: { course: { teacherUid: uid } } }),
      this.prisma.review.findMany({
        where: { course: { teacherUid: uid } },
        select: { rating: true },
      }),
    ]);
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

    return {
      uid: teacher.uid,
      slug: teacher.uid,
      name: teacher.name,
      title: teacher.expertise ?? null,
      bio: teacher.bio ?? null,
      experience: teacher.experience ?? null,
      portfolio: teacher.portfolio ?? null,
      profileTemplate: teacher.profileTemplate,
      profileAccent: teacher.profileAccent,
      cardStyle: teacher.cardStyle ?? null,
      profileBgLight: teacher.profileBgLight ?? null,
      profileBgDark: teacher.profileBgDark ?? null,
      avatarPath: teacher.avatarPath ?? null,
      rating: Math.round(avgRating * 10) / 10,
      students: studentCount,
    };
  }

  // -- Admin moderation --

  async findAllForAdmin(status?: string) {
    const courses = await this.prisma.course.findMany({
      where: status ? { status: status as never } : undefined,
      include: ADMIN_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => this.mapForAdmin(c));
  }

  async findOneForAdmin(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: ADMIN_INCLUDE,
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.mapForAdmin(course);
  }

  async approve(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'published', marginPercent, rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(course);
  }

  async reject(id: string, reason: string) {
    await this.findRawOrThrow(id);
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
      include: FULL_INCLUDE,
    });
    return this.map(course);
  }

  async setMargin(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const course = await this.prisma.course.update({
      where: { id },
      data: { marginPercent },
      include: FULL_INCLUDE,
    });
    return this.map(course);
  }
}
