import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private map(post: {
    id: string;
    teacherUid: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: post.id,
      teacherUid: post.teacherUid,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async findPublishedForInstructor(teacherUid: string) {
    const posts = await this.prisma.teacherPost.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.map(p));
  }

  async findAllForTeacher(teacherUid: string) {
    const posts = await this.prisma.teacherPost.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.map(p));
  }

  async create(teacherUid: string, dto: CreatePostDto) {
    const post = await this.prisma.teacherPost.create({
      data: { teacherUid, body: dto.body },
    });
    return this.map(post);
  }

  async update(teacherUid: string, id: string, dto: UpdatePostDto) {
    await this.assertOwned(teacherUid, id);
    const post = await this.prisma.teacherPost.update({
      where: { id },
      data: { body: dto.body },
    });
    return this.map(post);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.teacherPost.delete({ where: { id } });
  }

  private async assertOwned(teacherUid: string, id: string) {
    const post = await this.prisma.teacherPost.findUnique({ where: { id } });
    if (!post || post.teacherUid !== teacherUid) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
