import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

const WITH_COURSES = { courses: { select: { courseId: true } } };

type ActivityWithCourses = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  courses: { courseId: string }[];
};

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(activity: ActivityWithCourses) {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      tags: activity.tags,
      createdAt: activity.createdAt,
      courseIds: activity.courses.map((c) => c.courseId),
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const rows = await this.prisma.activity.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
      include: WITH_COURSES,
    });
    return rows.map((row) => this.map(row));
  }

  async create(teacherUid: string, dto: CreateActivityDto) {
    const activity = await this.prisma.activity.create({
      data: {
        teacherUid,
        title: dto.title.trim(),
        description: dto.description,
        tags: dto.tags ?? [],
      },
      include: WITH_COURSES,
    });
    return this.map(activity);
  }

  async update(teacherUid: string, id: string, dto: UpdateActivityDto) {
    await this.assertOwned(teacherUid, id);

    const activity = await this.prisma.activity.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        tags: dto.tags,
      },
      include: WITH_COURSES,
    });
    return this.map(activity);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.activity.delete({ where: { id } });
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.courseActivity.findUnique({
      where: { courseId_activityId: { courseId, activityId: id } },
    });

    if (existing) {
      await this.prisma.courseActivity.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseActivity.create({
        data: { courseId, activityId: id },
      });
    }

    const activity = await this.prisma.activity.findUniqueOrThrow({
      where: { id },
      include: WITH_COURSES,
    });
    return this.map(activity);
  }

  private async assertOwned(teacherUid: string, id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });
    if (!activity || activity.teacherUid !== teacherUid) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }
}
