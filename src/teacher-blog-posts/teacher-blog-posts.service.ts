import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoverImageStorage, type UploadedCoverFile } from '../common/cover-image.storage';
import { slugify } from '../common/pricing.util';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class TeacherBlogPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverStorage: CoverImageStorage,
  ) {}

  private map(post: {
    id: string;
    teacherUid: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    coverImagePath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: post.id,
      teacherUid: post.teacherUid,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      coverImagePath: post.coverImagePath,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async findPublishedForInstructor(teacherUid: string) {
    const posts = await this.prisma.teacherBlogPost.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.map(p));
  }

  async findAllForTeacher(teacherUid: string) {
    const posts = await this.prisma.teacherBlogPost.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.map(p));
  }

  async create(teacherUid: string, dto: CreateBlogPostDto) {
    const post = await this.prisma.teacherBlogPost.create({
      data: {
        teacherUid,
        title: dto.title,
        excerpt: dto.excerpt,
        body: dto.body,
        slug: await this.uniqueSlug(teacherUid, dto.title),
      },
    });
    return this.map(post);
  }

  async update(teacherUid: string, id: string, dto: UpdateBlogPostDto) {
    await this.assertOwned(teacherUid, id);
    const post = await this.prisma.teacherBlogPost.update({
      where: { id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        body: dto.body,
      },
    });
    return this.map(post);
  }

  async remove(teacherUid: string, id: string) {
    const post = await this.assertOwned(teacherUid, id);
    await this.coverStorage.delete(post.coverImagePath);
    await this.prisma.teacherBlogPost.delete({ where: { id } });
  }

  async uploadCover(teacherUid: string, id: string, file: UploadedCoverFile | undefined) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Cover must be an image file');
    }

    const post = await this.assertOwned(teacherUid, id);
    await this.coverStorage.delete(post.coverImagePath);
    const stored = await this.coverStorage.save('blog', teacherUid, file);
    const updated = await this.prisma.teacherBlogPost.update({
      where: { id },
      data: { coverImagePath: stored.storagePath },
    });
    return this.map(updated);
  }

  private async uniqueSlug(teacherUid: string, title: string) {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.teacherBlogPost.findFirst({ where: { teacherUid, slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async assertOwned(teacherUid: string, id: string) {
    const post = await this.prisma.teacherBlogPost.findUnique({ where: { id } });
    if (!post || post.teacherUid !== teacherUid) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }
}
