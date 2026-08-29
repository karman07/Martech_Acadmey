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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll(@CurrentProfile() profile: User) {
    return this.activitiesService.findAllForTeacher(profile.uid);
  }

  @Post()
  create(@CurrentProfile() profile: User, @Body() dto: CreateActivityDto) {
    return this.activitiesService.create(profile.uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(profile.uid, id, dto);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.activitiesService.remove(profile.uid, id);
  }

  @Post(':id/courses/:courseId')
  toggleCourse(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ) {
    return this.activitiesService.toggleCourse(profile.uid, id, courseId);
  }
}
