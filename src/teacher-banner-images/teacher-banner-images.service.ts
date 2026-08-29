import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerVideoDto } from './dto/create-banner-video.dto';
import { UpdateBannerImageOrderDto } from './dto/update-banner-image-order.dto';

const BANNER_ROOT = join(process.cwd(), 'uploads-public', 'banners');
const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

type BannerImageRow = {
  id: string;
  teacherUid: string;
  imagePath: string | null;
  videoPath: string | null;
  videoUrl: string | null;
  order: number;
};

@Injectable()
export class TeacherBannerImagesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(image: BannerImageRow) {
    return {
      id: image.id,
      teacherUid: image.teacherUid,
      imagePath: image.imagePath,
      videoPath: image.videoPath,
      videoUrl: image.videoUrl,
      order: image.order,
    };
  }

  /** Deletes whichever file (if any) backs this row from disk. Safe to call on rows with no file. */
  private async deleteStoredFile(image: {
    imagePath: string | null;
    videoPath: string | null;
  }) {
    const storagePath = image.imagePath ?? image.videoPath;
    if (!storagePath) return;
    await unlink(join(process.cwd(), 'uploads-public', storagePath)).catch(
      () => undefined,
    );
  }

  async findForInstructor(teacherUid: string) {
    const images = await this.prisma.teacherBannerImage.findMany({
      where: { teacherUid },
      orderBy: { order: 'asc' },
    });
    return images.map((i) => this.map(i));
  }

  async findAllForTeacher(teacherUid: string) {
    const images = await this.prisma.teacherBannerImage.findMany({
      where: { teacherUid },
      orderBy: { order: 'asc' },
    });
    return images.map((i) => this.map(i));
  }

  async create(teacherUid: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const extension = IMAGE_EXTENSION_BY_MIME[file.mimetype];
    if (!extension) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const dir = join(BANNER_ROOT, teacherUid);
    await mkdir(dir, { recursive: true });

    const filename = `${Date.now()}.${extension}`;
    await writeFile(join(dir, filename), file.buffer);
    const imagePath = `banners/${teacherUid}/${filename}`;

    const count = await this.prisma.teacherBannerImage.count({
      where: { teacherUid },
    });
    const image = await this.prisma.teacherBannerImage.create({
      data: { teacherUid, imagePath, order: count },
    });
    return this.map(image);
  }

  async createVideoFile(
    teacherUid: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const extension = VIDEO_EXTENSION_BY_MIME[file.mimetype];
    if (!extension) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const dir = join(BANNER_ROOT, teacherUid);
    await mkdir(dir, { recursive: true });

    const filename = `${Date.now()}.${extension}`;
    await writeFile(join(dir, filename), file.buffer);
    const videoPath = `banners/${teacherUid}/${filename}`;

    const count = await this.prisma.teacherBannerImage.count({
      where: { teacherUid },
    });
    const image = await this.prisma.teacherBannerImage.create({
      data: { teacherUid, videoPath, order: count },
    });
    return this.map(image);
  }

  async createVideo(teacherUid: string, dto: CreateBannerVideoDto) {
    const count = await this.prisma.teacherBannerImage.count({
      where: { teacherUid },
    });
    const image = await this.prisma.teacherBannerImage.create({
      data: { teacherUid, videoUrl: dto.videoUrl, order: count },
    });
    return this.map(image);
  }

  async updateOrder(
    teacherUid: string,
    id: string,
    dto: UpdateBannerImageOrderDto,
  ) {
    const image = await this.prisma.teacherBannerImage.findUnique({
      where: { id },
    });
    if (!image || image.teacherUid !== teacherUid) {
      throw new NotFoundException('Banner image not found');
    }
    const updated = await this.prisma.teacherBannerImage.update({
      where: { id },
      data: { order: dto.order },
    });
    return this.map(updated);
  }

  async remove(teacherUid: string, id: string) {
    const image = await this.prisma.teacherBannerImage.findUnique({
      where: { id },
    });
    if (!image || image.teacherUid !== teacherUid) {
      throw new NotFoundException('Banner image not found');
    }
    await this.deleteStoredFile(image);
    await this.prisma.teacherBannerImage.delete({ where: { id } });
  }
}
