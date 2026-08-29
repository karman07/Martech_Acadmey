import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const WITH_AUTHOR = {
  author: { select: { uid: true, name: true, avatarPath: true } },
};

type CommentWithAuthor = {
  id: string;
  teacherUid: string;
  authorUid: string;
  body: string;
  createdAt: Date;
  author: { uid: string; name: string; avatarPath: string | null };
};

@Injectable()
export class TeacherCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private map(comment: CommentWithAuthor) {
    return {
      id: comment.id,
      teacherUid: comment.teacherUid,
      authorUid: comment.authorUid,
      author: {
        uid: comment.author.uid,
        name: comment.author.name,
        avatarPath: comment.author.avatarPath,
      },
      body: comment.body,
      createdAt: comment.createdAt,
    };
  }

  async findForInstructor(teacherUid: string) {
    const comments = await this.prisma.teacherComment.findMany({
      where: { teacherUid },
      include: WITH_AUTHOR,
      orderBy: { createdAt: 'desc' },
    });
    return comments.map((c) => this.map(c));
  }

  async create(authorUid: string, teacherUid: string, dto: CreateCommentDto) {
    const teacher = await this.prisma.user.findUnique({
      where: { uid: teacherUid },
    });
    if (!teacher || teacher.role !== 'teacher') {
      throw new NotFoundException('Instructor not found');
    }

    const hasEngaged = await this.hasEngagedWithTeacher(authorUid, teacherUid);
    if (!hasEngaged) {
      throw new ForbiddenException(
        "Enroll in or purchase one of this instructor's courses, ebooks, or bootcamps to leave a comment.",
      );
    }

    const comment = await this.prisma.teacherComment.create({
      data: { teacherUid, authorUid, body: dto.body },
      include: WITH_AUTHOR,
    });
    return this.map(comment);
  }

  async remove(callerUid: string, id: string) {
    const comment = await this.prisma.teacherComment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorUid !== callerUid && comment.teacherUid !== callerUid) {
      throw new ForbiddenException('Not your comment');
    }
    await this.prisma.teacherComment.delete({ where: { id } });
  }

  private async hasEngagedWithTeacher(userUid: string, teacherUid: string) {
    const [enrollments, ebooks, bootcamps, bundles] = await Promise.all([
      this.prisma.enrollment.count({
        where: { userUid, course: { teacherUid } },
      }),
      this.prisma.ebookPurchase.count({
        where: { userUid, ebook: { teacherUid } },
      }),
      this.prisma.bootcampApplication.count({
        where: { userUid, bootcamp: { teacherUid } },
      }),
      this.prisma.bundlePurchase.count({
        where: { userUid, bundle: { teacherUid } },
      }),
    ]);
    return enrollments + ebooks + bootcamps + bundles > 0;
  }
}
