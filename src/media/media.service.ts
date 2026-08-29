import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaType } from '@prisma/client';
import { MEDIA_STORAGE, type MediaStorage } from './media-storage.interface';
import type { UploadedMediaFile } from './media-file.interface';
import type { CreateMediaDto } from './dto/create-media.dto';
import type { CreateMediaFromUrlDto } from './dto/create-media-from-url.dto';

const TYPE_BY_MIME_PREFIX: Array<[string, MediaType]> = [
  ['video/', 'video'],
  ['audio/', 'audio'],
  ['image/', 'image'],
];

function guessType(mimetype: string): MediaType {
  const match = TYPE_BY_MIME_PREFIX.find(([prefix]) =>
    mimetype.startsWith(prefix),
  );
  return match ? match[1] : 'document';
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  findAllForTeacher(teacherUid: string) {
    return this.prisma.mediaAsset.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { lessons: true } } },
    });
  }

  async create(
    teacherUid: string,
    file: UploadedMediaFile | undefined,
    dto: CreateMediaDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const stored = await this.storage.save(teacherUid, file);

    return this.prisma.mediaAsset.create({
      data: {
        teacherUid,
        name: dto.name?.trim() || file.originalname,
        description: dto.description?.trim() || null,
        tags: dto.tags ?? [],
        type: guessType(file.mimetype),
        sourceType: 'upload',
        mimeType: file.mimetype,
        sizeBytes: stored.sizeBytes,
        durationSec: dto.durationMin != null ? dto.durationMin * 60 : null,
        storagePath: stored.storagePath,
      },
    });
  }

  createFromUrl(teacherUid: string, dto: CreateMediaFromUrlDto) {
    return this.prisma.mediaAsset.create({
      data: {
        teacherUid,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        tags: dto.tags ?? [],
        type: dto.type ?? 'video',
        sourceType: 'url',
        url: dto.url,
        durationSec: dto.durationMin != null ? dto.durationMin * 60 : null,
      },
    });
  }

  async remove(teacherUid: string, id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: { lessons: true },
    });

    if (!asset || asset.teacherUid !== teacherUid) {
      throw new NotFoundException('Media asset not found');
    }

    if (asset.lessons.length > 0) {
      throw new ConflictException(
        'Media asset is still used by one or more lessons',
      );
    }

    if (asset.storagePath) {
      await this.storage.delete(asset.storagePath);
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
  }
}
