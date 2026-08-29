import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

const WITH_COURSES = { courses: { select: { courseId: true } } };

type AssignmentWithCourses = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  dueInDays: number;
  createdAt: Date;
  courses: { courseId: string }[];
};

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private map(assignment: AssignmentWithCourses) {
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      tags: assignment.tags,
      dueInDays: assignment.dueInDays,
      createdAt: assignment.createdAt,
      courseIds: assignment.courses.map((c) => c.courseId),
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const rows = await this.prisma.assignment.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
      include: WITH_COURSES,
    });
    return rows.map((row) => this.map(row));
  }

  async create(teacherUid: string, dto: CreateAssignmentDto) {
    const assignment = await this.prisma.assignment.create({
      data: {
        teacherUid,
        title: dto.title.trim(),
        description: dto.description,
        tags: dto.tags ?? [],
        dueInDays: dto.dueInDays,
      },
      include: WITH_COURSES,
    });
    return this.map(assignment);
  }

  async update(teacherUid: string, id: string, dto: UpdateAssignmentDto) {
    await this.assertOwned(teacherUid, id);

    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        tags: dto.tags,
        dueInDays: dto.dueInDays,
      },
      include: WITH_COURSES,
    });
    return this.map(assignment);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.assignment.delete({ where: { id } });
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.courseAssignment.findUnique({
      where: { courseId_assignmentId: { courseId, assignmentId: id } },
    });

    if (existing) {
      await this.prisma.courseAssignment.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseAssignment.create({
        data: { courseId, assignmentId: id },
      });
    }

    const assignment = await this.prisma.assignment.findUniqueOrThrow({
      where: { id },
      include: WITH_COURSES,
    });
    return this.map(assignment);
  }

  private async assertOwned(teacherUid: string, id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });
    if (!assignment || assignment.teacherUid !== teacherUid) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }
}
