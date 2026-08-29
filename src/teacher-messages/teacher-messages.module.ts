import { Module } from '@nestjs/common';
import { TeacherMessagesController } from './teacher-messages.controller';
import { TeacherMessagesService } from './teacher-messages.service';

@Module({
  controllers: [TeacherMessagesController],
  providers: [TeacherMessagesService],
})
export class TeacherMessagesModule {}
