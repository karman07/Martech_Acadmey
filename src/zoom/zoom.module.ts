import { Module } from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { ZoomController } from './zoom.controller';
import { ZoomOAuthController } from './zoom-oauth.controller';

@Module({
  controllers: [ZoomController, ZoomOAuthController],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
