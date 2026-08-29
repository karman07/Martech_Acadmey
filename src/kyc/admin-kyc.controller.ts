import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KycService } from './kyc.service';
import type { KycDocType } from './kyc.service';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { RequestInfoKycDto } from './dto/request-info-kyc.dto';

@Controller('admin/kyc')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminKycController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.kycService.findAllForAdmin(status);
  }

  @Post(':userUid/approve')
  approve(@Param('userUid') userUid: string) {
    return this.kycService.approve(userUid);
  }

  @Post(':userUid/reject')
  reject(@Param('userUid') userUid: string, @Body() dto: RejectKycDto) {
    return this.kycService.reject(userUid, dto.reason);
  }

  @Post(':userUid/request-info')
  requestInfo(@Param('userUid') userUid: string, @Body() dto: RequestInfoKycDto) {
    return this.kycService.requestInfo(userUid, dto.note);
  }

  @Get(':userUid/:docType')
  async getDocument(
    @Param('userUid') userUid: string,
    @Param('docType') docType: KycDocType,
    @Res() res: Response,
  ) {
    const path = await this.kycService.getDocumentPath(userUid, docType);
    res.sendFile(path);
  }
}
