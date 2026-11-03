import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeListPrice, discounted, slugify } from '../common/pricing.util';
import { CoverImageStorage } from '../common/cover-image.storage';
import type { UploadedCoverFile } from '../common/cover-image.storage';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';

const FULL_INCLUDE = {
  teacher: true,
  category: true,
  libraryEbook: { select: { id: true, title: true, fileType: true, pageCount: true, storagePath: true } },
  _count: { select: { purchases: true } },
};

type EbookWithRelations = Prisma.EbookGetPayload<{
  include: typeof FULL_INCLUDE;
}>;

@Injectable()
export class EbooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverStorage: CoverImageStorage,
  ) {}

  private map(ebook: EbookWithRelations) {
    const listPrice = computeListPrice(ebook.price, ebook.marginPercent);
    return {
      id: ebook.id,
      slug: ebook.slug,
      teacherUid: ebook.teacherUid,
      instructor: {
        uid: ebook.teacher.uid,
        name: ebook.teacher.name,
        title: ebook.teacher.expertise ?? null,
        bio: ebook.teacher.bio ?? null,
        avatarPath: ebook.teacher.avatarPath ?? null,
      },
      title: ebook.title,
      description: ebook.description,
      format: ebook.format,
      price: ebook.price.toNumber(),
      discountPercent: ebook.discountPercent,
      marginPercent: ebook.marginPercent,
      listPrice,
      finalPrice: discounted(listPrice, ebook.discountPercent),
      status: ebook.status,
      rejectionReason: ebook.rejectionReason,
      coverTheme: { from: ebook.coverFrom, to: ebook.coverTo },
      coverImagePath: ebook.coverImagePath,
      pages: ebook.pages,
      libraryEbookId: ebook.libraryEbookId,
      libraryEbookTitle: ebook.libraryEbook?.title ?? null,
      views: ebook.views,
      purchases: ebook._count.purchases,
      downloads: ebook._count.purchases,
      createdAt: ebook.createdAt,
      categorySlug: ebook.categorySlug,
      categoryName: ebook.category?.name ?? null,
      longDescription: ebook.longDescription,
      fileSizeMB: ebook.fileSizeMB,
      rating: ebook.rating,
      previewParagraphs: ebook.previewParagraphs,
      fullParagraphs: ebook.fullParagraphs,
    };
  }

  private async assertLibraryEbookOwned(teacherUid: string, id: string) {
    const libraryEbook = await this.prisma.libraryEbook.findUnique({
      where: { id },
    });
    if (!libraryEbook || libraryEbook.teacherUid !== teacherUid) {
      throw new BadRequestException(
        'Pick a PDF or DOCX from your library to publish as an ebook.',
      );
    }
    return libraryEbook;
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.ebook.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(teacherUid: string, dto: CreateEbookDto) {
    const libraryEbook = await this.assertLibraryEbookOwned(
      teacherUid,
      dto.libraryEbookId,
    );
    const ebook = await this.prisma.ebook.create({
      data: {
        teacherUid,
        slug: await this.uniqueSlug(dto.title),
        title: dto.title,
        description: dto.description,
        format: libraryEbook.fileType,
        price: dto.price,
        discountPercent: dto.discountPercent ?? 0,
        pages: libraryEbook.pageCount ?? 0,
        coverFrom: dto.coverFrom,
        coverTo: dto.coverTo,
        libraryEbookId: libraryEbook.id,
        categorySlug: dto.categorySlug,
        longDescription: dto.longDescription ?? '',
        fileSizeMB: dto.fileSizeMB ?? 0,
        previewParagraphs: dto.previewParagraphs ?? [],
        fullParagraphs: dto.fullParagraphs ?? [],
      },
      include: FULL_INCLUDE,
    });
    return this.map(ebook);
  }

  async uploadCover(
    teacherUid: string,
    id: string,
    file: UploadedCoverFile | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Cover must be an image file');
    }

    const ebook = await this.assertOwned(teacherUid, id);
    await this.coverStorage.delete(ebook.coverImagePath);
    const stored = await this.coverStorage.save('ebooks', teacherUid, file);

    const updated = await this.prisma.ebook.update({
      where: { id },
      data: { coverImagePath: stored.storagePath },
      include: FULL_INCLUDE,
    });
    return this.map(updated);
  }

  async findAllForTeacher(teacherUid: string) {
    const ebooks = await this.prisma.ebook.findMany({
      where: { teacherUid },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return ebooks.map((e) => this.map(e));
  }

  private async findRawOrThrow(id: string) {
    const ebook = await this.prisma.ebook.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!ebook) throw new NotFoundException('Ebook not found');
    return ebook;
  }

  private async assertOwned(teacherUid: string, id: string) {
    const ebook = await this.findRawOrThrow(id);
    if (ebook.teacherUid !== teacherUid) {
      throw new ForbiddenException('Not your ebook');
    }
    return ebook;
  }

  async findOneForTeacher(teacherUid: string, id: string) {
    return this.map(await this.assertOwned(teacherUid, id));
  }

  async update(teacherUid: string, id: string, dto: UpdateEbookDto) {
    await this.assertOwned(teacherUid, id);

    const { libraryEbookId, ...rest } = dto;
    let derived: { format?: string; pages?: number; libraryEbookId?: string } = {};
    if (libraryEbookId) {
      const libraryEbook = await this.assertLibraryEbookOwned(
        teacherUid,
        libraryEbookId,
      );
      derived = {
        format: libraryEbook.fileType,
        pages: libraryEbook.pageCount ?? 0,
        libraryEbookId: libraryEbook.id,
      };
    }

    const ebook = await this.prisma.ebook.update({
      where: { id },
      data: { ...rest, ...derived, status: 'draft', rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(ebook);
  }

  async submit(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    const ebook = await this.prisma.ebook.update({
      where: { id },
      data: { status: 'pending_review', rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(ebook);
  }

  async findPublished(teacherUid?: string) {
    const ebooks = await this.prisma.ebook.findMany({
      where: { status: 'published', teacherUid },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return ebooks.map((e) => this.map(e));
  }

  async findPublishedBySlug(slug: string) {
    const ebook = await this.prisma.ebook.findUnique({
      where: { slug },
      include: FULL_INCLUDE,
    });
    if (!ebook || ebook.status !== 'published') {
      throw new NotFoundException('Ebook not found');
    }
    await this.prisma.ebook.update({
      where: { id: ebook.id },
      data: { views: { increment: 1 } },
    });
    return this.map({ ...ebook, views: ebook.views + 1 });
  }

  async findMine(userUid: string) {
    const purchases = await this.prisma.ebookPurchase.findMany({
      where: { userUid },
      include: { ebook: { include: FULL_INCLUDE } },
      orderBy: { purchasedAt: 'desc' },
    });
    return purchases.map((p) => ({
      ...this.map(p.ebook),
      purchasedAt: p.purchasedAt,
    }));
  }

  /** Free ebooks (finalPrice === 0) skip /payments — claimed directly, idempotently. */
  async claimFree(userUid: string, ebookId: string) {
    const ebook = await this.prisma.ebook.findUnique({
      where: { id: ebookId },
    });
    if (!ebook || ebook.status !== 'published') {
      throw new NotFoundException('Ebook not found');
    }

    const listPrice = computeListPrice(ebook.price, ebook.marginPercent);
    const finalPrice = discounted(listPrice, ebook.discountPercent);
    if (finalPrice > 0) {
      throw new BadRequestException(
        'This ebook requires payment — use /payments/order',
      );
    }

    return this.prisma.ebookPurchase.upsert({
      where: { userUid_ebookId: { userUid, ebookId } },
      update: {},
      create: { userUid, ebookId },
    });
  }

  // -- Admin moderation --

  /** Lightweight row projection for the admin content-review list — skips description/
   * longDescription/previewParagraphs/fullParagraphs, which the list row never renders. */
  async findAllForAdmin(status?: string) {
    const ebooks = await this.prisma.ebook.findMany({
      where: status ? { status: status as never } : undefined,
      select: {
        id: true,
        title: true,
        format: true,
        price: true,
        discountPercent: true,
        marginPercent: true,
        status: true,
        rejectionReason: true,
        coverFrom: true,
        coverTo: true,
        coverImagePath: true,
        category: { select: { name: true } },
        teacher: { select: { uid: true, name: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ebooks.map((e) => {
      const listPrice = computeListPrice(e.price, e.marginPercent);
      return {
        id: e.id,
        title: e.title,
        category: e.category?.name ?? null,
        format: e.format,
        instructor: { uid: e.teacher.uid, name: e.teacher.name },
        price: e.price.toNumber(),
        marginPercent: e.marginPercent,
        finalPrice: discounted(listPrice, e.discountPercent),
        status: e.status,
        rejectionReason: e.rejectionReason,
        coverTheme: { from: e.coverFrom, to: e.coverTo },
        coverImagePath: e.coverImagePath,
      };
    });
  }

  async approve(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const ebook = await this.prisma.ebook.update({
      where: { id },
      data: { status: 'published', marginPercent, rejectionReason: null },
      include: FULL_INCLUDE,
    });
    return this.map(ebook);
  }

  async reject(id: string, reason: string) {
    await this.findRawOrThrow(id);
    const ebook = await this.prisma.ebook.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
      include: FULL_INCLUDE,
    });
    return this.map(ebook);
  }

  async setMargin(id: string, marginPercent: number) {
    await this.findRawOrThrow(id);
    const ebook = await this.prisma.ebook.update({
      where: { id },
      data: { marginPercent },
      include: FULL_INCLUDE,
    });
    return this.map(ebook);
  }
}
