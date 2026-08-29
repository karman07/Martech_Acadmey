import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { CreateMediaFromUrlDto } from './dto/create-media-from-url.dto';
import type { UploadedMediaFile } from './media-file.interface';

const MAX_MEDIA_SIZE = 500 * 1024 * 1024;

@Controller('media')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll(@CurrentProfile() profile: User) {
    return this.mediaService.findAllForTeacher(profile.uid);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_MEDIA_SIZE } }),
  )
  upload(
    @CurrentProfile() profile: User,
    @UploadedFile() file: UploadedMediaFile,
    @Body() dto: CreateMediaDto,
  ) {
    return this.mediaService.create(profile.uid, file, dto);
  }

  @Post('url')
  fromUrl(@CurrentProfile() profile: User, @Body() dto: CreateMediaFromUrlDto) {
    return this.mediaService.createFromUrl(profile.uid, dto);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.mediaService.remove(profile.uid, id);
  }
}
