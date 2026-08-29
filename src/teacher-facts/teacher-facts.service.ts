import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';

@Injectable()
export class TeacherFactsService {
  constructor(private readonly prisma: PrismaService) {}

  private map(fact: {
    id: string;
    teacherUid: string;
    label: string;
    value: string;
    order: number;
  }) {
    return {
      id: fact.id,
      teacherUid: fact.teacherUid,
      label: fact.label,
      value: fact.value,
      order: fact.order,
    };
  }

  async findForInstructor(teacherUid: string) {
    const facts = await this.prisma.teacherFact.findMany({
      where: { teacherUid },
      orderBy: { order: 'asc' },
    });
    return facts.map((f) => this.map(f));
  }

  async findAllForTeacher(teacherUid: string) {
    const facts = await this.prisma.teacherFact.findMany({
      where: { teacherUid },
      orderBy: { order: 'asc' },
    });
    return facts.map((f) => this.map(f));
  }

  async create(teacherUid: string, dto: CreateFactDto) {
    const count = await this.prisma.teacherFact.count({ where: { teacherUid } });
    const fact = await this.prisma.teacherFact.create({
      data: {
        teacherUid,
        label: dto.label,
        value: dto.value,
        order: dto.order ?? count,
      },
    });
    return this.map(fact);
  }

  async update(teacherUid: string, id: string, dto: UpdateFactDto) {
    await this.assertOwned(teacherUid, id);
    const fact = await this.prisma.teacherFact.update({
      where: { id },
      data: { label: dto.label, value: dto.value, order: dto.order },
    });
    return this.map(fact);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.teacherFact.delete({ where: { id } });
  }

  private async assertOwned(teacherUid: string, id: string) {
    const fact = await this.prisma.teacherFact.findUnique({ where: { id } });
    if (!fact || fact.teacherUid !== teacherUid) {
      throw new NotFoundException('Fact not found');
    }
    return fact;
  }
}
