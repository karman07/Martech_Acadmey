import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

export interface UploadedCoverFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const COVERS_ROOT = join(process.cwd(), 'uploads-public', 'covers');

/**
 * Shared cover-image storage for Courses, Bootcamps, and Bundles — same local-disk
 * convention as MediaAsset/LibraryEbook storage, namespaced by `feature` so each
 * content type's thumbnails live under their own folder.
 */
@Injectable()
export class CoverImageStorage {
  async save(
    feature: string,
    ownerUid: string,
    file: UploadedCoverFile,
  ): Promise<{ storagePath: string; sizeBytes: number }> {
    const dir = join(COVERS_ROOT, feature, ownerUid);
    await mkdir(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    await writeFile(join(dir, filename), file.buffer);

    return {
      storagePath: join('covers', feature, ownerUid, filename),
      sizeBytes: file.size,
    };
  }

  async delete(storagePath: string | null | undefined): Promise<void> {
    if (!storagePath) return;
    await unlink(join(process.cwd(), 'uploads-public', storagePath)).catch(
      () => undefined,
    );
  }
}
