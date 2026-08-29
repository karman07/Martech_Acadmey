import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import type {
  LibraryEbookStorage,
  StoredLibraryEbookFile,
} from './library-ebook-storage.interface';
import type { UploadedLibraryEbookFile } from './library-ebook-file.interface';

const LIBRARY_EBOOK_ROOT = join(
  process.cwd(),
  'uploads-public',
  'library-ebooks',
);

@Injectable()
export class LocalDiskLibraryEbookStorage implements LibraryEbookStorage {
  async save(
    teacherUid: string,
    file: UploadedLibraryEbookFile,
  ): Promise<StoredLibraryEbookFile> {
    const teacherDir = join(LIBRARY_EBOOK_ROOT, teacherUid);
    await mkdir(teacherDir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    await writeFile(join(teacherDir, filename), file.buffer);

    return {
      storagePath: join('library-ebooks', teacherUid, filename),
      sizeBytes: file.size,
    };
  }

  async delete(storagePath: string): Promise<void> {
    await unlink(join(process.cwd(), 'uploads-public', storagePath)).catch(
      () => undefined,
    );
  }
}
