import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EbooksModule } from '../ebooks/ebooks.module';
import { BootcampsModule } from '../bootcamps/bootcamps.module';
import { BundlesModule } from '../bundles/bundles.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CoursesModule, EbooksModule, BootcampsModule, BundlesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
