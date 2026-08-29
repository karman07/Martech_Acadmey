import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import type { QuizQuestionDto } from './dto/quiz-question.dto';

const WITH_RELATIONS = {
  questions: { orderBy: { order: 'asc' as const } },
  courses: { select: { courseId: true } },
};

type QuizWithRelations = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  questions: {
    id: string;
    prompt: string;
    options: string[];
    correctOptionIndex: number;
  }[];
  courses: { courseId: string }[];
};

function assertValidQuestions(questions: QuizQuestionDto[] | undefined) {
  if (!questions) return;
  for (const q of questions) {
    if (q.correctOptionIndex >= q.options.length) {
      throw new BadRequestException(
        `correctOptionIndex is out of range for question "${q.prompt}"`,
      );
    }
  }
}

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(quiz: QuizWithRelations) {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      tags: quiz.tags,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
      })),
      courseIds: quiz.courses.map((c) => c.courseId),
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const rows = await this.prisma.quiz.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
      include: WITH_RELATIONS,
    });
    return rows.map((row) => this.map(row));
  }

  async create(teacherUid: string, dto: CreateQuizDto) {
    assertValidQuestions(dto.questions);

    const quiz = await this.prisma.quiz.create({
      data: {
        teacherUid,
        title: dto.title.trim(),
        description: dto.description,
        tags: dto.tags ?? [],
        questions: {
          create: (dto.questions ?? []).map((q, order) => ({
            prompt: q.prompt.trim(),
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            order,
          })),
        },
      },
      include: WITH_RELATIONS,
    });
    return this.map(quiz);
  }

  async update(teacherUid: string, id: string, dto: UpdateQuizDto) {
    await this.assertOwned(teacherUid, id);
    assertValidQuestions(dto.questions);

    await this.prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          description: dto.description,
          tags: dto.tags,
        },
      });

      if (dto.questions) {
        await tx.quizQuestion.deleteMany({ where: { quizId: id } });
        await tx.quizQuestion.createMany({
          data: dto.questions.map((q, order) => ({
            quizId: id,
            prompt: q.prompt.trim(),
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            order,
          })),
        });
      }
    });

    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: WITH_RELATIONS,
    });
    return this.map(quiz);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.quiz.delete({ where: { id } });
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.courseQuiz.findUnique({
      where: { courseId_quizId: { courseId, quizId: id } },
    });

    if (existing) {
      await this.prisma.courseQuiz.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseQuiz.create({
        data: { courseId, quizId: id },
      });
    }

    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: WITH_RELATIONS,
    });
    return this.map(quiz);
  }

  private async assertOwned(teacherUid: string, id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz || quiz.teacherUid !== teacherUid) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }
}
