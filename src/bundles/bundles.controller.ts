import {
  Body,
  Controller,
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
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import type { UploadedCoverFile } from '../common/cover-image.storage';

const MAX_COVER_SIZE = 8 * 1024 * 1024;

@Controller()
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Get('bundles')
  findPublished() {
    return this.bundlesService.findPublished();
  }

  @Get('bundles/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.bundlesService.findPublishedBySlug(slug);
  }

  @Post('teacher/bundles')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateBundleDto) {
    return this.bundlesService.create(profile.uid, dto);
  }

  @Get('teacher/bundles')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.bundlesService.findAllForTeacher(profile.uid);
  }

  @Get('teacher/bundles/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findOneForTeacher(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.bundlesService.findOneForTeacher(profile.uid, id);
  }

  @Patch('teacher/bundles/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateBundleDto,
  ) {
    return this.bundlesService.update(profile.uid, id, dto);
  }

  @Post('teacher/bundles/:id/submit')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  submit(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.bundlesService.submit(profile.uid, id);
  }

  @Post('teacher/bundles/:id/cover')
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
    return this.bundlesService.uploadCover(profile.uid, id, file);
  }
}
