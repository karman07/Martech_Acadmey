import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
@UseGuards(FirebaseAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  enroll(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentsService.enrollFree(user.uid, dto.courseId);
  }

  @Get('me')
  findMine(@CurrentUser() user: DecodedIdToken) {
    return this.enrollmentsService.findMine(user.uid);
  }

  @Post(':courseId/lessons/:lessonId/complete')
  toggleComplete(
    @CurrentUser() user: DecodedIdToken,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.enrollmentsService.toggleLessonComplete(
      user.uid,
      courseId,
      lessonId,
    );
  }
}
