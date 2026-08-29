import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { LibraryEbooksService } from './library-ebooks.service';
import { CreateLibraryEbookDto } from './dto/create-library-ebook.dto';
import { UpdateLibraryEbookDto } from './dto/update-library-ebook.dto';
import type { UploadedLibraryEbookFile } from './library-ebook-file.interface';

const MAX_LIBRARY_EBOOK_SIZE = 50 * 1024 * 1024;

@Controller('library-ebooks')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('teacher')
export class LibraryEbooksController {
  constructor(private readonly libraryEbooksService: LibraryEbooksService) {}

  @Get()
  findAll(@CurrentProfile() profile: User) {
    return this.libraryEbooksService.findAllForTeacher(profile.uid);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_LIBRARY_EBOOK_SIZE } }),
  )
  upload(
    @CurrentProfile() profile: User,
    @UploadedFile() file: UploadedLibraryEbookFile,
    @Body() dto: CreateLibraryEbookDto,
  ) {
    return this.libraryEbooksService.create(profile.uid, file, dto);
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdateLibraryEbookDto,
  ) {
    return this.libraryEbooksService.update(profile.uid, id, dto);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.libraryEbooksService.remove(profile.uid, id);
  }

  @Post(':id/courses/:courseId')
  toggleCourse(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ) {
    return this.libraryEbooksService.toggleCourse(profile.uid, id, courseId);
  }
}
