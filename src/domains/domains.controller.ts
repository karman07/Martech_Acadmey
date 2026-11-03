import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { DomainsService } from './domains.service';

@Controller('teacher/domain')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class DomainsController {
  constructor(private readonly domains: DomainsService) {}

  @Get()
  status(@CurrentProfile() profile: User) {
    return this.domains.getStatus(profile.uid);
  }

  @Post()
  set(@CurrentProfile() profile: User, @Body('domain') domain: string) {
    return this.domains.setDomain(profile.uid, domain ?? '');
  }

  @Post('verify')
  verify(@CurrentProfile() profile: User) {
    return this.domains.verifyDomain(profile.uid);
  }

  @Delete()
  async remove(@CurrentProfile() profile: User) {
    await this.domains.removeDomain(profile.uid);
    return { removed: true };
  }
}
