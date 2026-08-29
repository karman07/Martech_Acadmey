import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

@Controller('teacher/analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  findMine(@CurrentProfile() profile: User) {
    return this.analyticsService.findForTeacher(profile.uid);
  }
}
