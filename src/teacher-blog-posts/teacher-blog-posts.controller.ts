import {
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
import type { UploadedCoverFile } from '../common/cover-image.storage';
import { TeacherBlogPostsService } from './teacher-blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

const MAX_COVER_SIZE = 8 * 1024 * 1024;

@Controller()
export class TeacherBlogPostsController {
  constructor(private readonly blogPostsService: TeacherBlogPostsService) {}

  // -- Public --

  @Get('instructors/:uid/blog')
  findPublished(@Param('uid') uid: string) {
    return this.blogPostsService.findPublishedForInstructor(uid);
  }

  // -- Teacher --

  @Get('teacher/blog-posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.blogPostsService.findAllForTeacher(profile.uid);
  }

  @Post('teacher/blog-posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateBlogPostDto) {
    return this.blogPostsService.create(profile.uid, dto);
  }

  @Patch('teacher/blog-posts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blogPostsService.update(profile.uid, id, dto);
  }

  @Delete('teacher/blog-posts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.blogPostsService.remove(profile.uid, id);
  }

  @Post('teacher/blog-posts/:id/cover')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_COVER_SIZE } }))
  uploadCover(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @UploadedFile() file: UploadedCoverFile,
  ) {
    return this.blogPostsService.uploadCover(profile.uid, id, file);
  }
}
