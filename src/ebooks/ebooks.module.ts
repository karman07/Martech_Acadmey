import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { EbooksController } from './ebooks.controller';
import { EbooksService } from './ebooks.service';

@Module({
  imports: [CommonModule],
  controllers: [EbooksController],
  providers: [EbooksService],
  exports: [EbooksService],
})
export class EbooksModule {}
