import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/pricing.util';
import { CreateTeacherPageDto } from './dto/create-teacher-page.dto';
import { UpdateTeacherPageDto } from './dto/update-teacher-page.dto';

@Injectable()
export class TeacherPagesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(page: {
    id: string;
    teacherUid: string;
    title: string;
    slug: string;
    navLabel: string | null;
    body: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: page.id,
      teacherUid: page.teacherUid,
      title: page.title,
      slug: page.slug,
      navLabel: page.navLabel ?? page.title,
      body: page.body,
      order: page.order,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  async findPublishedForInstructor(teacherUid: string) {
    const pages = await this.prisma.teacherPage.findMany({
      where: { teacherUid },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return pages.map((p) => this.map(p));
  }

  async findAllForTeacher(teacherUid: string) {
    const pages = await this.prisma.teacherPage.findMany({
      where: { teacherUid },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return pages.map((p) => this.map(p));
  }

  async create(teacherUid: string, dto: CreateTeacherPageDto) {
    const count = await this.prisma.teacherPage.count({ where: { teacherUid } });
    const page = await this.prisma.teacherPage.create({
      data: {
        teacherUid,
        title: dto.title,
        navLabel: dto.navLabel,
        body: dto.body,
        order: dto.order ?? count,
        slug: await this.uniqueSlug(teacherUid, dto.title),
      },
    });
    return this.map(page);
  }

  async update(teacherUid: string, id: string, dto: UpdateTeacherPageDto) {
    await this.assertOwned(teacherUid, id);
    const page = await this.prisma.teacherPage.update({
      where: { id },
      data: {
        title: dto.title,
        navLabel: dto.navLabel,
        body: dto.body,
        order: dto.order,
      },
    });
    return this.map(page);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.teacherPage.delete({ where: { id } });
  }

  private async uniqueSlug(teacherUid: string, title: string) {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.teacherPage.findFirst({ where: { teacherUid, slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async assertOwned(teacherUid: string, id: string) {
    const page = await this.prisma.teacherPage.findUnique({ where: { id } });
    if (!page || page.teacherUid !== teacherUid) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }
}
