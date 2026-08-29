import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class TeacherMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(message: {
    id: string;
    teacherUid: string;
    senderName: string;
    senderEmail: string;
    body: string;
    isRead: boolean;
    createdAt: Date;
  }) {
    return {
      id: message.id,
      teacherUid: message.teacherUid,
      senderName: message.senderName,
      senderEmail: message.senderEmail,
      body: message.body,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const messages = await this.prisma.teacherMessage.findMany({
      where: { teacherUid },
      orderBy: { createdAt: 'desc' },
    });
    return messages.map((m) => this.map(m));
  }

  async create(teacherUid: string, dto: CreateMessageDto) {
    const teacher = await this.prisma.user.findUnique({ where: { uid: teacherUid } });
    if (!teacher || teacher.role !== 'teacher') {
      throw new NotFoundException('Instructor not found');
    }

    const message = await this.prisma.teacherMessage.create({
      data: {
        teacherUid,
        senderName: dto.senderName,
        senderEmail: dto.senderEmail,
        body: dto.body,
      },
    });
    return this.map(message);
  }

  async markRead(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    const message = await this.prisma.teacherMessage.update({
      where: { id },
      data: { isRead: true },
    });
    return this.map(message);
  }

  async remove(teacherUid: string, id: string) {
    await this.assertOwned(teacherUid, id);
    await this.prisma.teacherMessage.delete({ where: { id } });
  }

  private async assertOwned(teacherUid: string, id: string) {
    const message = await this.prisma.teacherMessage.findUnique({ where: { id } });
    if (!message || message.teacherUid !== teacherUid) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }
}
