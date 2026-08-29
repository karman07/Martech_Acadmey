import type { UploadedMediaFile } from './media-file.interface';

export interface StoredFile {
  storagePath: string;
  sizeBytes: number;
}

/**
 * Persistence boundary for uploaded media. Local disk today; swap the
 * provider bound to MEDIA_STORAGE in media.module.ts (e.g. for S3) without
 * touching MediaService.
 */
export interface MediaStorage {
  save(teacherUid: string, file: UploadedMediaFile): Promise<StoredFile>;
  delete(storagePath: string): Promise<void>;
}

export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');
