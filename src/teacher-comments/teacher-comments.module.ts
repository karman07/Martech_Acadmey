import { Module } from '@nestjs/common';
import { TeacherCommentsController } from './teacher-comments.controller';
import { TeacherCommentsService } from './teacher-comments.service';

@Module({
  controllers: [TeacherCommentsController],
  providers: [TeacherCommentsService],
})
export class TeacherCommentsModule {}
