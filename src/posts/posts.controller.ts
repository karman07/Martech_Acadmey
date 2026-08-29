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
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // -- Public --

  @Get('instructors/:uid/posts')
  findPublished(@Param('uid') uid: string) {
    return this.postsService.findPublishedForInstructor(uid);
  }

  // -- Teacher --

  @Get('teacher/posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.postsService.findAllForTeacher(profile.uid);
  }

  @Post('teacher/posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  create(@CurrentProfile() profile: User, @Body() dto: CreatePostDto) {
    return this.postsService.create(profile.uid, dto);
  }

  @Patch('teacher/posts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  update(
    @CurrentProfile() profile: User,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(profile.uid, id, dto);
  }

  @Delete('teacher/posts/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.postsService.remove(profile.uid, id);
  }
}
