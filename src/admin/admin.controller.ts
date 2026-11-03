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
import { AdminService, type ContentType } from './admin.service';
import {
  ApproveContentDto,
  RejectContentDto,
  SetMarginDto,
} from './dto/moderation.dto';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('content')
  findAllContent(
    @Query('status') status?: string,
    @Query('contentType') contentType?: ContentType,
  ) {
    return this.adminService.findAllContent(status, contentType);
  }

  @Get('users')
  findUsers(@Query('role') role?: string) {
    return this.adminService.findUsers(role);
  }

  @Get('users/:uid')
  findUserDetail(@Param('uid') uid: string) {
    return this.adminService.findUserDetail(uid);
  }

  @Post(':type/:id/approve')
  approve(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Body() dto: ApproveContentDto,
  ) {
    return this.adminService.approve(type, id, dto.marginPercent);
  }

  @Post(':type/:id/reject')
  reject(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Body() dto: RejectContentDto,
  ) {
    return this.adminService.reject(type, id, dto.reason);
  }

  @Patch(':type/:id/margin')
  setMargin(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Body() dto: SetMarginDto,
  ) {
    return this.adminService.setMargin(type, id, dto.marginPercent);
  }
}
