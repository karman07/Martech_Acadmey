import { Module } from '@nestjs/common';
import { TeacherFactsController } from './teacher-facts.controller';
import { TeacherFactsService } from './teacher-facts.service';

@Module({
  controllers: [TeacherFactsController],
  providers: [TeacherFactsService],
})
export class TeacherFactsModule {}
