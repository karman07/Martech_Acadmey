import {
  Body,
  Controller,
  Delete,
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
import type { User } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
} from './dto/course-module.dto';
import {
  CreateCourseLessonDto,
  UpdateCourseLessonDto,
} from './dto/course-lesson.dto';
import { CreateReviewDto } from './dto/review.dto';
import type { UploadedCoverFile } from '../common/cover-image.storage';

const MAX_COVER_SIZE = 8 * 1024 * 1024;

@Controller()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // -- Public --

  @Get('courses')
  findPublished(
    @Query('category') category?: string,
    @Query('instructor') teacherUid?: string,
    @Query('level') level?: string,
  ) {
    return this.coursesService.findPublished({ category, teacherUid, level });
  }

  @Get('courses/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findPublishedBySlug(slug);
  }

  @Get('instructors')
  findInstructors() {
    return this.coursesService.findInstructors();
  }

  // -- Admin --

  @Get('admin/courses/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  findOneForAdmin(@Param('id') id: string) {
    return this.coursesService.findOneForAdmin(id);
  }

  @Post('admin/courses/:id/unpublish')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  unpublishByAdmin(@Param('id') id: string) {
    return this.coursesService.unpublishByAdmin(id);
  }

  @Get('instructors/:uid')
  findInstructor(@Param('uid') uid: string) {
    return this.coursesService.findInstructorByUid(uid);
  }

  @Post('courses/:slug/reviews')
  @UseGuards(FirebaseAuthGuard)
  addReview(
    @CurrentUser() user: DecodedIdToken,
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.coursesService.addReview(user.uid, slug, dto);
  }

  // -- Teacher --

  @Post('teacher/courses')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(profile.uid, dto);
  }

  @Get('teacher/courses')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.coursesService.findAllForTeacher(profile.uid);
  }

  @Get('teacher/courses/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findOneForTeacher(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.coursesService.findOneForTeacher(profile.uid, id);
  }

  @Get('teacher/courses/:id/progress')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  getProgress(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.coursesService.getStudentProgress(profile.uid, id);
  }

  @Patch('teacher/courses/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(profile.uid, id, dto);
  }

  @Post('teacher/courses/:id/submit')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  submit(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.coursesService.submit(profile.uid, id);
  }

  @Post('teacher/courses/:id/unpublish')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  unpublish(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.coursesService.unpublish(profile.uid, id);
  }

  @Post('teacher/courses/:id/cover')
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
    return this.coursesService.uploadCover(profile.uid, id, file);
  }

  @Post('teacher/courses/:id/modules')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  addModule(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: CreateCourseModuleDto,
  ) {
    return this.coursesService.addModule(profile.uid, id, dto);
  }

  @Patch('teacher/courses/:id/modules/:moduleId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  updateModule(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateCourseModuleDto,
  ) {
    return this.coursesService.updateModule(profile.uid, id, moduleId, dto);
  }

  @Delete('teacher/courses/:id/modules/:moduleId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  removeModule(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.coursesService.removeModule(profile.uid, id, moduleId);
  }

  @Post('teacher/courses/:id/modules/:moduleId/lessons')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  addLesson(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateCourseLessonDto,
  ) {
    return this.coursesService.addLesson(profile.uid, id, moduleId, dto);
  }

  @Patch('teacher/courses/:id/modules/:moduleId/lessons/:lessonId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  updateLesson(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateCourseLessonDto,
  ) {
    return this.coursesService.updateLesson(
      profile.uid,
      id,
      moduleId,
      lessonId,
      dto,
    );
  }

  @Delete('teacher/courses/:id/modules/:moduleId/lessons/:lessonId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  removeLesson(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.coursesService.removeLesson(
      profile.uid,
      id,
      moduleId,
      lessonId,
    );
  }
}
