import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { DomainsPublicController } from './domains-public.controller';
import { DomainsInternalController } from './domains-internal.controller';

@Module({
  controllers: [DomainsController, DomainsPublicController, DomainsInternalController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
