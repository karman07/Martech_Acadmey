import { Module } from '@nestjs/common';
import { LiveClassesController } from './live-classes.controller';
import { LiveClassesService } from './live-classes.service';
import { ZoomModule } from '../zoom/zoom.module';

@Module({
  imports: [ZoomModule],
  controllers: [LiveClassesController],
  providers: [LiveClassesService],
})
export class LiveClassesModule {}
