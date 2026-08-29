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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Controller('assignments')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  findAll(@CurrentProfile() profile: User) {
    return this.assignmentsService.findAllForTeacher(profile.uid);
  }

  @Post()
  create(@CurrentProfile() profile: User, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(profile.uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(profile.uid, id, dto);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.assignmentsService.remove(profile.uid, id);
  }

  @Post(':id/courses/:courseId')
  toggleCourse(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ) {
    return this.assignmentsService.toggleCourse(profile.uid, id, courseId);
  }
}
