import { Module } from '@nestjs/common';
import { CoverImageStorage } from './cover-image.storage';

@Module({
  providers: [CoverImageStorage],
  exports: [CoverImageStorage],
})
export class CommonModule {}
