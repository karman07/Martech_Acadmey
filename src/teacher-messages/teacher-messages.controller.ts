import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentProfile } from '../auth/current-profile.decorator';
import type { User } from '@prisma/client';
import { TeacherMessagesService } from './teacher-messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
export class TeacherMessagesController {
  constructor(private readonly messagesService: TeacherMessagesService) {}

  // -- Public — anyone can contact a teacher, no auth required --

  @Post('instructors/:uid/messages')
  create(@Param('uid') uid: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(uid, dto);
  }

  // -- Teacher --

  @Get('teacher/messages')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  findAllForTeacher(@CurrentProfile() profile: User) {
    return this.messagesService.findAllForTeacher(profile.uid);
  }

  @Patch('teacher/messages/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  markRead(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.messagesService.markRead(profile.uid, id);
  }

  @Delete('teacher/messages/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('teacher')
  remove(@CurrentProfile() profile: User, @Param('id') id: string) {
    return this.messagesService.remove(profile.uid, id);
  }
}
