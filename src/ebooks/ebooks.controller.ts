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
import { EbooksService } from './ebooks.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import type { UploadedCoverFile } from '../common/cover-image.storage';

const MAX_COVER_SIZE = 8 * 1024 * 1024;

@Controller()
export class EbooksController {
  constructor(private readonly ebooksService: EbooksService) {}

  @Get('ebooks')
  findPublished(@Query('instructor') teacherUid?: string) {
    return this.ebooksService.findPublished(teacherUid);
  }

  @Get('ebooks/mine')
  @UseGuards(FirebaseAuthGuard)
  findMine(@CurrentUser() user: DecodedIdToken) {
    return this.ebooksService.findMine(user.uid);
  }

  @Post('ebooks/:id/claim')
  @UseGuards(FirebaseAuthGuard)
  claimFree(@CurrentUser() user: DecodedIdToken, @Param('id') id: string) {
    return this.ebooksService.claimFree(user.uid, id);
  }

  @Get('ebooks/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.ebooksService.findPublishedBySlug(slug);
  }

  @Post('teacher/ebooks')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateEbookDto) {
    return this.ebooksService.create(profile.uid, dto);
  }

  @Get('teacher/ebooks')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.ebooksService.findAllForTeacher(profile.uid);
  }

  @Get('teacher/ebooks/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findOneForTeacher(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.ebooksService.findOneForTeacher(profile.uid, id);
  }

  @Patch('teacher/ebooks/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateEbookDto,
  ) {
    return this.ebooksService.update(profile.uid, id, dto);
  }

  @Post('teacher/ebooks/:id/submit')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  submit(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.ebooksService.submit(profile.uid, id);
  }

  @Post('teacher/ebooks/:id/cover')
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
    return this.ebooksService.uploadCover(profile.uid, id, file);
  }
}
