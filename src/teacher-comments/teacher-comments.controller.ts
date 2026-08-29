import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { TeacherCommentsService } from './teacher-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
export class TeacherCommentsController {
  constructor(private readonly commentsService: TeacherCommentsService) {}

  // -- Public --

  @Get('instructors/:uid/comments')
  findForInstructor(@Param('uid') uid: string) {
    return this.commentsService.findForInstructor(uid);
  }

  // -- Any signed-in user --

  @Post('instructors/:uid/comments')
  @UseGuards(FirebaseAuthGuard)
  create(
    @CurrentUser() user: DecodedIdToken,
    @Param('uid') uid: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.uid, uid, dto);
  }

  @Delete('teacher-comments/:id')
  @UseGuards(FirebaseAuthGuard)
  remove(@CurrentUser() user: DecodedIdToken, @Param('id') id: string) {
    return this.commentsService.remove(user.uid, id);
  }
}
