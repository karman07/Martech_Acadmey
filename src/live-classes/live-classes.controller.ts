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
import { LiveClassesService } from './live-classes.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { UpdateLiveClassDto } from './dto/update-live-class.dto';

@Controller('live-classes')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class LiveClassesController {
  constructor(private readonly liveClassesService: LiveClassesService) {}

  @Get()
  findAll(@CurrentProfile() profile: User) {
    return this.liveClassesService.findAllForTeacher(profile.uid);
  }

  @Post()
  create(@CurrentProfile() profile: User, @Body() dto: CreateLiveClassDto) {
    return this.liveClassesService.create(profile.uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateLiveClassDto,
  ) {
    return this.liveClassesService.update(profile.uid, id, dto);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.liveClassesService.remove(profile.uid, id);
  }

  @Post(':id/courses/:courseId')
  toggleCourse(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ) {
    return this.liveClassesService.toggleCourse(profile.uid, id, courseId);
  }
}
