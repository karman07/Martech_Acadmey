import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { ZoomService } from './zoom.service';

@Controller('teacher/zoom')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class ZoomController {
  constructor(private readonly zoom: ZoomService) {}

  @Get('status')
  status(@CurrentProfile() profile: User) {
    return this.zoom.getStatus(profile.uid);
  }

  @Post('connect')
  connect(@CurrentProfile() profile: User) {
    return { url: this.zoom.getAuthorizeUrl(this.zoom.signState(profile.uid)) };
  }

  @Delete()
  async disconnect(@CurrentProfile() profile: User) {
    await this.zoom.disconnectTeacher(profile.uid);
    return { connected: false };
  }
}
