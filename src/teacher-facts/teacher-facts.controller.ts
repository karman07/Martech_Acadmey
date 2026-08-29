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
import { TeacherFactsService } from './teacher-facts.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';

@Controller()
export class TeacherFactsController {
  constructor(private readonly factsService: TeacherFactsService) {}

  // -- Public --

  @Get('instructors/:uid/facts')
  findForInstructor(@Param('uid') uid: string) {
    return this.factsService.findForInstructor(uid);
  }

  // -- Teacher --

  @Get('teacher/facts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.factsService.findAllForTeacher(profile.uid);
  }

  @Post('teacher/facts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreateFactDto) {
    return this.factsService.create(profile.uid, dto);
  }

  @Patch('teacher/facts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateFactDto,
  ) {
    return this.factsService.update(profile.uid, id, dto);
  }

  @Delete('teacher/facts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.factsService.remove(profile.uid, id);
  }
}
