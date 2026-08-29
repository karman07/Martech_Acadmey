import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CategoriesService } from './categories.service';
import { UpsertCategoryDto } from './dto/upsert-category.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('categories')
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post('admin/categories')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: UpsertCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('admin/categories/:slug')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('slug') slug: string, @Body() dto: Partial<UpsertCategoryDto>) {
    return this.categoriesService.update(slug, dto);
  }

  @Delete('admin/categories/:slug')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('slug') slug: string) {
    return this.categoriesService.remove(slug);
  }
}
