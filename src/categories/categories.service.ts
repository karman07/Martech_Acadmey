import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCategoryDto } from './dto/upsert-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: UpsertCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Category already exists');
    }
    return this.prisma.category.create({ data: dto });
  }

  async update(slug: string, dto: Partial<UpsertCategoryDto>) {
    await this.findOneOrThrow(slug);
    return this.prisma.category.update({ where: { slug }, data: dto });
  }

  async remove(slug: string) {
    await this.findOneOrThrow(slug);
    await this.prisma.category.delete({ where: { slug } });
  }

  private async findOneOrThrow(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
