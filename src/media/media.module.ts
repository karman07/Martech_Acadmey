import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MEDIA_STORAGE } from './media-storage.interface';
import { LocalDiskMediaStorage } from './local-disk-media.storage';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    { provide: MEDIA_STORAGE, useClass: LocalDiskMediaStorage },
  ],
})
export class MediaModule {}
