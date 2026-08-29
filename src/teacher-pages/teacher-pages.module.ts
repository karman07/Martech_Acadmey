import { Module } from '@nestjs/common';
import { TeacherPagesController } from './teacher-pages.controller';
import { TeacherPagesService } from './teacher-pages.service';

@Module({
  controllers: [TeacherPagesController],
  providers: [TeacherPagesService],
})
export class TeacherPagesModule {}
