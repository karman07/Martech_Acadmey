import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { CourseNotificationsService } from './course-notifications.service';

@Module({
  providers: [MailService, CourseNotificationsService],
  exports: [MailService, CourseNotificationsService],
})
export class MailModule {}
