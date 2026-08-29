import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { TeacherBlogPostsController } from './teacher-blog-posts.controller';
import { TeacherBlogPostsService } from './teacher-blog-posts.service';

@Module({
  imports: [CommonModule],
  controllers: [TeacherBlogPostsController],
  providers: [TeacherBlogPostsService],
})
export class TeacherBlogPostsModule {}
