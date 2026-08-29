import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import type { MediaStorage, StoredFile } from './media-storage.interface';
import type { UploadedMediaFile } from './media-file.interface';

const MEDIA_ROOT = join(process.cwd(), 'uploads-public', 'media');

@Injectable()
export class LocalDiskMediaStorage implements MediaStorage {
  async save(teacherUid: string, file: UploadedMediaFile): Promise<StoredFile> {
    const teacherDir = join(MEDIA_ROOT, teacherUid);
    await mkdir(teacherDir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    await writeFile(join(teacherDir, filename), file.buffer);

    return {
      storagePath: join('media', teacherUid, filename),
      sizeBytes: file.size,
    };
  }

  async delete(storagePath: string): Promise<void> {
    await unlink(join(process.cwd(), 'uploads-public', storagePath)).catch(
      () => undefined,
    );
  }
}
