import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { TeacherBannerImagesService } from './teacher-banner-images.service';
import { CreateBannerVideoDto } from './dto/create-banner-video.dto';
import { UpdateBannerImageOrderDto } from './dto/update-banner-image-order.dto';

const MAX_BANNER_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BANNER_VIDEO_SIZE = 20 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

@Controller()
export class TeacherBannerImagesController {
  constructor(
    private readonly bannerImagesService: TeacherBannerImagesService,
  ) {}

  // -- Public --

  @Get('instructors/:uid/banner-images')
  findForInstructor(@Param('uid') uid: string) {
    return this.bannerImagesService.findForInstructor(uid);
  }

  // -- Teacher --

  @Get('teacher/banner-images')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.bannerImagesService.findAllForTeacher(profile.uid);
  }

  @Post('teacher/banner-images')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_BANNER_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  create(
    @CurrentProfile() profile: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerImagesService.create(profile.uid, file);
  }

  @Post('teacher/banner-images/video')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  createVideo(
    @CurrentProfile() profile: User,
    @Body() dto: CreateBannerVideoDto,
  ) {
    return this.bannerImagesService.createVideo(profile.uid, dto);
  }

  @Post('teacher/banner-images/video-upload')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: MAX_BANNER_VIDEO_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  createVideoFile(
    @CurrentProfile() profile: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerImagesService.createVideoFile(profile.uid, file);
  }

  @Patch('teacher/banner-images/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  updateOrder(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateBannerImageOrderDto,
  ) {
    return this.bannerImagesService.updateOrder(profile.uid, id, dto);
  }

  @Delete('teacher/banner-images/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.bannerImagesService.remove(profile.uid, id);
  }
}
