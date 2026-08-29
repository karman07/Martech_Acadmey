import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { BootcampsController } from './bootcamps.controller';
import { BootcampsService } from './bootcamps.service';

@Module({
  imports: [CommonModule],
  controllers: [BootcampsController],
  providers: [BootcampsService],
  exports: [BootcampsService],
})
export class BootcampsModule {}
