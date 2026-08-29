import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';
import type { LibraryEbookFileType } from '@prisma/client';
import {
  LIBRARY_EBOOK_STORAGE,
  type LibraryEbookStorage,
} from './library-ebook-storage.interface';
import type { UploadedLibraryEbookFile } from './library-ebook-file.interface';
import type { CreateLibraryEbookDto } from './dto/create-library-ebook.dto';
import type { UpdateLibraryEbookDto } from './dto/update-library-ebook.dto';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const WITH_COURSES = { courses: { select: { courseId: true } } };

type LibraryEbookWithCourses = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  fileType: LibraryEbookFileType;
  originalFilename: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number;
  pageCount: number | null;
  createdAt: Date;
  courses: { courseId: string }[];
};

function detectFileType(file: UploadedLibraryEbookFile): LibraryEbookFileType {
  const name = file.originalname.toLowerCase();
  if (file.mimetype === PDF_MIME || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (file.mimetype === DOCX_MIME || name.endsWith('.docx')) {
    return 'docx';
  }
  throw new BadRequestException(
    'Only PDF or DOCX files are supported for the library.',
  );
}

async function detectPageCount(
  fileType: LibraryEbookFileType,
  file: UploadedLibraryEbookFile,
): Promise<number | null> {
  if (fileType !== 'pdf') {
    return null;
  }
  try {
    const doc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

@Injectable()
export class LibraryEbooksService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LIBRARY_EBOOK_STORAGE) private readonly storage: LibraryEbookStorage,
  ) {}

  private map(ebook: LibraryEbookWithCourses) {
    return {
      id: ebook.id,
      title: ebook.title,
      description: ebook.description,
      tags: ebook.tags,
      fileType: ebook.fileType,
      originalFilename: ebook.originalFilename,
      mimeType: ebook.mimeType,
      storagePath: ebook.storagePath,
      sizeBytes: ebook.sizeBytes,
      pageCount: ebook.pageCount,
      createdAt: ebook.createdAt,
      courseIds: ebook.courses.map((c) => c.courseId),
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const rows = await this.prisma.libraryEbook.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
      include: WITH_COURSES,
    });
    return rows.map((row) => this.map(row));
  }

  async create(
    teacherUid: string,
    file: UploadedLibraryEbookFile | undefined,
    dto: CreateLibraryEbookDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileType = detectFileType(file);
    const [stored, pageCount] = await Promise.all([
      this.storage.save(teacherUid, file),
      detectPageCount(fileType, file),
    ]);

    const ebook = await this.prisma.libraryEbook.create({
      data: {
        teacherUid,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        tags: dto.tags ?? [],
        fileType,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        storagePath: stored.storagePath,
        sizeBytes: stored.sizeBytes,
        pageCount,
      },
      include: WITH_COURSES,
    });
    return this.map(ebook);
  }

  async update(teacherUid: string, id: string, dto: UpdateLibraryEbookDto) {
    await this.assertOwned(teacherUid, id);

    const ebook = await this.prisma.libraryEbook.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        tags: dto.tags,
      },
      include: WITH_COURSES,
    });
    return this.map(ebook);
  }

  async remove(teacherUid: string, id: string) {
    const ebook = await this.assertOwned(teacherUid, id);
    await this.storage.delete(ebook.storagePath);
    await this.prisma.libraryEbook.delete({ where: { id } });
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.courseLibraryEbook.findUnique({
      where: { courseId_libraryEbookId: { courseId, libraryEbookId: id } },
    });

    if (existing) {
      await this.prisma.courseLibraryEbook.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseLibraryEbook.create({
        data: { courseId, libraryEbookId: id },
      });
    }

    const ebook = await this.prisma.libraryEbook.findUniqueOrThrow({
      where: { id },
      include: WITH_COURSES,
    });
    return this.map(ebook);
  }

  private async assertOwned(teacherUid: string, id: string) {
    const ebook = await this.prisma.libraryEbook.findUnique({ where: { id } });
    if (!ebook || ebook.teacherUid !== teacherUid) {
      throw new NotFoundException('Library ebook not found');
    }
    return ebook;
  }
}
