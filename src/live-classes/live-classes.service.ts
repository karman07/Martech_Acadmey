import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { UpdateLiveClassDto } from './dto/update-live-class.dto';

const WITH_COURSES = { courses: { select: { courseId: true } } };

type LiveClassWithCourses = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  dateISO: Date;
  url: string;
  createdAt: Date;
  courses: { courseId: string }[];
};

@Injectable()
export class LiveClassesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(liveClass: LiveClassWithCourses) {
    return {
      id: liveClass.id,
      title: liveClass.title,
      description: liveClass.description,
      tags: liveClass.tags,
      dateISO: liveClass.dateISO,
      url: liveClass.url,
      createdAt: liveClass.createdAt,
      courseIds: liveClass.courses.map((c) => c.courseId),
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const rows = await this.prisma.liveClass.findMany({
      where: { teacherUid },
      orderBy: { dateISO: 'asc' },
      include: WITH_COURSES,
    });
    return rows.map((row) => this.map(row));
  }

  async create(teacherUid: string, dto: CreateLiveClassDto) {
    const liveClass = await this.prisma.liveClass.create({
      data: {
        teacherUid,
        title: dto.title.trim(),
        description: dto.description,
        tags: dto.tags ?? [],
        dateISO: new Date(dto.dateISO),
        url: dto.url,
      },
      include: WITH_COURSES,
    });
    return this.map(liveClass);
  }

  async update(teacherUid: string, id: string, dto: UpdateLiveClassDto) {
    await this.assertOwned(teacherUid, id);

    const liveClass = await this.prisma.liveClass.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        tags: dto.tags,
        dateISO: dto.dateISO ? new Date(dto.dateISO) : undefined,
        url: dto.url,
      },
      include: WITH_COURSES,
    });
    return this.map(liveClass);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.liveClass.delete({ where: { id } });
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.courseLiveClass.findUnique({
      where: { courseId_liveClassId: { courseId, liveClassId: id } },
    });

    if (existing) {
      await this.prisma.courseLiveClass.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseLiveClass.create({
        data: { courseId, liveClassId: id },
      });
    }

    const liveClass = await this.prisma.liveClass.findUniqueOrThrow({
      where: { id },
      include: WITH_COURSES,
    });
    return this.map(liveClass);
  }

  private async assertOwned(teacherUid: string, id: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id },
    });
    if (!liveClass || liveClass.teacherUid !== teacherUid) {
      throw new NotFoundException('Live class not found');
    }
    return liveClass;
  }
}
