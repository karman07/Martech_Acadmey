import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { TeacherPagesService } from './teacher-pages.service';
import { CreateTeacherPageDto } from './dto/create-teacher-page.dto';
import { UpdateTeacherPageDto } from './dto/update-teacher-page.dto';

@Controller()
export class TeacherPagesController {
  constructor(private readonly pagesService: TeacherPagesService) {}

  // -- Public --

  @Get('instructors/:uid/pages')
  findPublished(@Param('uid') uid: string) {
    return this.pagesService.findPublishedForInstructor(uid);
  }

  // -- Teacher --

  @Get('teacher/pages')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.pagesService.findAllForTeacher(profile.uid);
  }

  @Post('teacher/pages')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateTeacherPageDto) {
    return this.pagesService.create(profile.uid, dto);
  }

  @Patch('teacher/pages/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherPageDto,
  ) {
    return this.pagesService.update(profile.uid, id, dto);
  }

  @Delete('teacher/pages/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.pagesService.remove(profile.uid, id);
  }
}
