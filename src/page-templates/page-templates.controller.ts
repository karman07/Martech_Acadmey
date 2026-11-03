import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { PageTemplatesService } from './page-templates.service';
import { CreatePageTemplateDto } from './dto/create-page-template.dto';
import { UpdatePageTemplateDto } from './dto/update-page-template.dto';
import { RenderPageTemplateDto } from './dto/render-page-template.dto';

@Controller()
export class PageTemplatesController {
  constructor(private readonly pageTemplatesService: PageTemplatesService) {}

  // -- Public / teacher-facing --

  @Get('page-templates')
  findAllActive() {
    return this.pageTemplatesService.findAllActive();
  }

  @Post('page-templates/:key/render')
  render(@Param('key') key: string, @Body() dto: RenderPageTemplateDto) {
    return this.pageTemplatesService.renderForInstructor(key, dto.instructorData);
  }

  // -- Admin --

  @Get('admin/page-templates')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  findAllForAdmin() {
    return this.pageTemplatesService.findAllForAdmin();
  }

  @Get('admin/page-templates/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  findOneForAdmin(@Param('id') id: string) {
    return this.pageTemplatesService.findOneForAdmin(id);
  }

  @Post('admin/page-templates')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  create(@CurrentProfile() profile: User, @Body() dto: CreatePageTemplateDto) {
    return this.pageTemplatesService.create(profile.uid, dto);
  }

  @Patch('admin/page-templates/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdatePageTemplateDto) {
    return this.pageTemplatesService.update(id, dto);
  }

  @Delete('admin/page-templates/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.pageTemplatesService.remove(id);
  }
}
