import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SalesAdminService } from './sales-admin.service';
import { CreateSalesRepDto } from './dto/create-sales-rep.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { CreateSalesPayoutDto } from './dto/create-sales-payout.dto';
import { UpdateSalesPayoutStatusDto } from './dto/update-sales-payout-status.dto';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class SalesAdminController {
  constructor(private readonly salesAdminService: SalesAdminService) {}

  @Post('sales-reps')
  createSalesRep(@Body() dto: CreateSalesRepDto) {
    return this.salesAdminService.createSalesRep(dto);
  }

  @Get('sales-reps')
  findAllSalesReps() {
    return this.salesAdminService.findAllSalesReps();
  }

  @Patch('sales-reps/:uid/commission')
  updateCommission(@Param('uid') uid: string, @Body() dto: UpdateCommissionDto) {
    return this.salesAdminService.updateCommission(uid, dto.commissionPercent);
  }

  @Get('enquiries')
  findAllEnquiries(@Query('status') status?: string) {
    return this.salesAdminService.findAllEnquiries(status);
  }

  @Patch('enquiries/:id/done')
  markEnquiryDone(@Param('id') id: string) {
    return this.salesAdminService.markEnquiryDone(id);
  }

  @Get('sales-payouts')
  findAllPayouts(@Query('salesRepUid') salesRepUid?: string) {
    return this.salesAdminService.findAllPayouts(salesRepUid);
  }

  @Post('sales-payouts')
  createPayout(@Body() dto: CreateSalesPayoutDto) {
    return this.salesAdminService.createPayout(dto);
  }

  @Patch('sales-payouts/:id')
  updatePayoutStatus(@Param('id') id: string, @Body() dto: UpdateSalesPayoutStatusDto) {
    return this.salesAdminService.updatePayoutStatus(id, dto);
  }
}
