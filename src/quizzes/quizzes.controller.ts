import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Controller('quizzes')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  findAll(@CurrentProfile() profile: User) {
    return this.quizzesService.findAllForTeacher(profile.uid);
  }

  @Post()
  create(@CurrentProfile() profile: User, @Body() dto: CreateQuizDto) {
    return this.quizzesService.create(profile.uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.update(profile.uid, id, dto);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.quizzesService.remove(profile.uid, id);
  }

  @Post(':id/courses/:courseId')
  toggleCourse(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ) {
    return this.quizzesService.toggleCourse(profile.uid, id, courseId);
  }
}
