import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { VerifyPaymentDto } from '../payments/dto/verify-payment.dto';

@Controller('sales')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('me')
  getMe(@CurrentProfile() profile: User) {
    return this.salesService.getMe(profile.uid);
  }

  @Post('enquiries')
  createEnquiry(@CurrentProfile() profile: User, @Body() dto: CreateEnquiryDto) {
    return this.salesService.createEnquiry(profile.uid, dto);
  }

  @Get('enquiries')
  findMyEnquiries(@CurrentProfile() profile: User, @Query('status') status?: string) {
    return this.salesService.findMyEnquiries(profile.uid, status);
  }

  @Post('enroll')
  enroll(@CurrentProfile() profile: User, @Body() dto: EnrollStudentDto) {
    return this.salesService.enroll(profile.uid, dto);
  }

  @Post('enroll/verify')
  verifyEnrollment(@CurrentProfile() profile: User, @Body() dto: VerifyPaymentDto) {
    return this.salesService.verifyEnrollment(profile.uid, dto);
  }
}
