import { Module } from '@nestjs/common';
import { PageTemplatesController } from './page-templates.controller';
import { PageTemplatesService } from './page-templates.service';

@Module({
  controllers: [PageTemplatesController],
  providers: [PageTemplatesService],
  exports: [PageTemplatesService],
})
export class PageTemplatesModule {}
