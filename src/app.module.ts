import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { KycModule } from './kyc/kyc.module';
import { CategoriesModule } from './categories/categories.module';
import { MediaModule } from './media/media.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { LibraryEbooksModule } from './library-ebooks/library-ebooks.module';
import { ActivitiesModule } from './activities/activities.module';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CoursesModule } from './courses/courses.module';
import { EbooksModule } from './ebooks/ebooks.module';
import { BootcampsModule } from './bootcamps/bootcamps.module';
import { BundlesModule } from './bundles/bundles.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PaymentsModule } from './payments/payments.module';
import { PayoutsModule } from './payouts/payouts.module';
import { SalesModule } from './sales/sales.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { PostsModule } from './posts/posts.module';
import { TeacherCommentsModule } from './teacher-comments/teacher-comments.module';
import { TeacherFactsModule } from './teacher-facts/teacher-facts.module';
import { TeacherBannerImagesModule } from './teacher-banner-images/teacher-banner-images.module';
import { TeacherMessagesModule } from './teacher-messages/teacher-messages.module';
import { TeacherBlogPostsModule } from './teacher-blog-posts/teacher-blog-posts.module';
import { TeacherPagesModule } from './teacher-pages/teacher-pages.module';
import { PageTemplatesModule } from './page-templates/page-templates.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { ZoomModule } from './zoom/zoom.module';
import { DomainsModule } from './domains/domains.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Only user-chosen public content (avatars, teacher media) lives here —
    // KYC documents stay in the separate, never-served `uploads/kyc` directory.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads-public'),
      serveRoot: '/public',
    }),
    FirebaseModule,
    PrismaModule,
    UsersModule,
    KycModule,
    CategoriesModule,
    MediaModule,
    AssignmentsModule,
    LibraryEbooksModule,
    ActivitiesModule,
    LiveClassesModule,
    QuizzesModule,
    CoursesModule,
    EbooksModule,
    BootcampsModule,
    BundlesModule,
    EnrollmentsModule,
    PaymentsModule,
    PayoutsModule,
    SalesModule,
    AnalyticsModule,
    AdminModule,
    PostsModule,
    TeacherCommentsModule,
    TeacherFactsModule,
    TeacherBannerImagesModule,
    TeacherMessagesModule,
    TeacherBlogPostsModule,
    TeacherPagesModule,
    PageTemplatesModule,
    SettingsModule,
    MailModule,
    ZoomModule,
    DomainsModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
