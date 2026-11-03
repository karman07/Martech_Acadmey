import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { User } from '@prisma/client';
import { BootcampsService } from './bootcamps.service';
import { CreateBootcampDto } from './dto/create-bootcamp.dto';
import { UpdateBootcampDto } from './dto/update-bootcamp.dto';
import type { UploadedCoverFile } from '../common/cover-image.storage';

const MAX_COVER_SIZE = 8 * 1024 * 1024;

@Controller()
export class BootcampsController {
  constructor(private readonly bootcampsService: BootcampsService) {}

  @Get('bootcamps')
  findPublished(@Query('instructor') teacherUid?: string) {
    return this.bootcampsService.findPublished(teacherUid);
  }

  @Get('bootcamps/mine')
  @UseGuards(FirebaseAuthGuard)
  findMine(@CurrentUser() user: DecodedIdToken) {
    return this.bootcampsService.findMine(user.uid);
  }

  @Get('bootcamps/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.bootcampsService.findPublishedBySlug(slug);
  }

  @Post('teacher/bootcamps')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateBootcampDto) {
    return this.bootcampsService.create(profile.uid, dto);
  }

  @Get('teacher/bootcamps')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.bootcampsService.findAllForTeacher(profile.uid);
  }

  @Get('teacher/bootcamps/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findOneForTeacher(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.bootcampsService.findOneForTeacher(profile.uid, id);
  }

  @Patch('teacher/bootcamps/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateBootcampDto,
  ) {
    return this.bootcampsService.update(profile.uid, id, dto);
  }

  @Post('teacher/bootcamps/:id/submit')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  submit(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.bootcampsService.submit(profile.uid, id);
  }

  @Post('teacher/bootcamps/:id/cover')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_COVER_SIZE } }),
  )
  uploadCover(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @UploadedFile() file: UploadedCoverFile,
  ) {
    return this.bootcampsService.uploadCover(profile.uid, id, file);
  }

  @Post('teacher/bootcamps/:id/courses/:courseId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  toggleCourse(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ) {
    return this.bootcampsService.toggleCourse(profile.uid, id, courseId);
  }
}
