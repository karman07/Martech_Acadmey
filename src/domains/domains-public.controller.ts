import { Controller, Get, Query } from '@nestjs/common';
import { DomainsService } from './domains.service';

/** The one route the Next.js middleware calls on every request to a hostname it
 * doesn't recognize, to find out which teacher's profile (if any) that custom
 * domain should serve. Intentionally public and read-only — it only ever reveals
 * a teacher uid for a domain that teacher already proved ownership of. */
@Controller('domains')
export class DomainsPublicController {
  constructor(private readonly domains: DomainsService) {}

  @Get('resolve')
  async resolve(@Query('host') host: string | undefined) {
    if (!host) return { teacherUid: null };
    const teacherUid = await this.domains.resolveVerifiedDomain(host);
    return { teacherUid };
  }
}
