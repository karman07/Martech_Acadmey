import type { UploadedLibraryEbookFile } from './library-ebook-file.interface';

export interface StoredLibraryEbookFile {
  storagePath: string;
  sizeBytes: number;
}

/**
 * Persistence boundary for uploaded library ebook files. Local disk today;
 * swap the provider bound to LIBRARY_EBOOK_STORAGE in library-ebooks.module.ts
 * (e.g. for S3) without touching LibraryEbooksService.
 */
export interface LibraryEbookStorage {
  save(
    teacherUid: string,
    file: UploadedLibraryEbookFile,
  ): Promise<StoredLibraryEbookFile>;
  delete(storagePath: string): Promise<void>;
}

export const LIBRARY_EBOOK_STORAGE = Symbol('LIBRARY_EBOOK_STORAGE');
