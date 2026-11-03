import { Body, Controller, ForbiddenException, Get, Headers, Post } from '@nestjs/common';
import { DomainsService } from './domains.service';

/** Called only by the cert-issuance script running on the server itself (see
 * infra/issue-domain-certs.sh) — never by a browser. Guarded by a shared secret
 * rather than the normal Firebase auth, since the caller isn't a logged-in user. */
@Controller('internal/domains')
export class DomainsInternalController {
  constructor(private readonly domains: DomainsService) {}

  private checkSecret(secret: string | undefined) {
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid internal API secret.');
    }
  }

  @Get('pending-certs')
  async pendingCerts(@Headers('x-internal-secret') secret: string | undefined) {
    this.checkSecret(secret);
    return { domains: await this.domains.listPendingCertificates() };
  }

  @Post('mark-certified')
  async markCertified(
    @Headers('x-internal-secret') secret: string | undefined,
    @Body('domain') domain: string,
  ) {
    this.checkSecret(secret);
    await this.domains.markCertificateIssued(domain);
    return { ok: true };
  }
}
