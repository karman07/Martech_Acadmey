import { Module } from '@nestjs/common';
import { TeacherBannerImagesController } from './teacher-banner-images.controller';
import { TeacherBannerImagesService } from './teacher-banner-images.service';

@Module({
  controllers: [TeacherBannerImagesController],
  providers: [TeacherBannerImagesService],
})
export class TeacherBannerImagesModule {}
