import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';

@Controller()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('teacher/payouts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findMine(@CurrentProfile() profile: User) {
    return this.payoutsService.findForTeacher(profile.uid);
  }

  @Get('admin/payouts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query('teacherUid') teacherUid?: string) {
    return this.payoutsService.findAll(teacherUid);
  }

  @Post('admin/payouts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreatePayoutDto) {
    return this.payoutsService.create(dto);
  }

  @Patch('admin/payouts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePayoutStatusDto) {
    return this.payoutsService.updateStatus(id, dto);
  }
}
