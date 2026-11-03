import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { resolveTxt } from 'dns/promises';
import { PrismaService } from '../prisma/prisma.service';

const VERIFY_SUBDOMAIN = '_martech-domain-verify';

// Labels: alphanumeric + hyphen, 1-63 chars, not starting/ending with a hyphen;
// at least one dot; TLD at least 2 letters. Deliberately conservative — this
// only needs to accept real-world domains, not every RFC-legal edge case.
const DOMAIN_RE =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,}$/i;

export type DomainStatus = {
  domain: string;
  verified: boolean;
  verifiedAt: string | null;
  certificateIssued: boolean;
  lastCheckedAt: string | null;
  dns: {
    cnameTarget: string | null;
    aRecordIp: string | null;
    txtRecordName: string;
    txtRecordValue: string;
  };
} | null;

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  private get cnameTarget(): string | null {
    return process.env.CUSTOM_DOMAIN_CNAME_TARGET || null;
  }

  private get aRecordIp(): string | null {
    return process.env.CUSTOM_DOMAIN_SERVER_IP || null;
  }

  private normalizeDomain(raw: string): string {
    const domain = raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/\.$/, '');
    if (!DOMAIN_RE.test(domain)) {
      throw new BadRequestException(
        'That doesn\'t look like a valid domain (e.g. "coach.example.com" or "example.com").',
      );
    }
    return domain;
  }

  private toStatus(row: {
    domain: string;
    verified: boolean;
    verifiedAt: Date | null;
    certificateIssued: boolean;
    lastCheckedAt: Date | null;
    verificationToken: string;
  }): DomainStatus {
    return {
      domain: row.domain,
      verified: row.verified,
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
      certificateIssued: row.certificateIssued,
      lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
      dns: {
        cnameTarget: this.cnameTarget,
        aRecordIp: this.aRecordIp,
        txtRecordName: `${VERIFY_SUBDOMAIN}.${row.domain}`,
        txtRecordValue: `martech-verify=${row.verificationToken}`,
      },
    };
  }

  async getStatus(teacherUid: string): Promise<DomainStatus> {
    const row = await this.prisma.teacherCustomDomain.findUnique({ where: { teacherUid } });
    return row ? this.toStatus(row) : null;
  }

  async setDomain(teacherUid: string, rawDomain: string): Promise<DomainStatus> {
    const domain = this.normalizeDomain(rawDomain);

    const existing = await this.prisma.teacherCustomDomain.findUnique({ where: { domain } });
    if (existing && existing.teacherUid !== teacherUid) {
      throw new BadRequestException('That domain is already connected to another instructor.');
    }

    const row = await this.prisma.teacherCustomDomain.upsert({
      where: { teacherUid },
      create: { teacherUid, domain, verificationToken: randomBytes(16).toString('hex') },
      update: {
        domain,
        verificationToken: randomBytes(16).toString('hex'),
        verified: false,
        verifiedAt: null,
        certificateIssued: false,
        certificateIssuedAt: null,
        lastCheckedAt: null,
      },
    });
    return this.toStatus(row);
  }

  async removeDomain(teacherUid: string): Promise<void> {
    await this.prisma.teacherCustomDomain.deleteMany({ where: { teacherUid } });
  }

  /** Checks the TXT record the teacher was asked to add and flips `verified` on
   * success. Doesn't check the CNAME/A record itself — DNS resolvers (including
   * ours) can cache a stale answer for a routing record far longer than is useful
   * here, whereas the low-TTL TXT record is a reliable, fast ownership proof; the
   * routing record only matters once traffic actually arrives, which it can't do
   * until it's correctly pointed here anyway. */
  async verifyDomain(teacherUid: string): Promise<DomainStatus> {
    const row = await this.prisma.teacherCustomDomain.findUnique({ where: { teacherUid } });
    if (!row) {
      throw new NotFoundException('No domain is set up for this teacher yet.');
    }

    const expected = `martech-verify=${row.verificationToken}`;
    let found = false;
    try {
      const records = await resolveTxt(`${VERIFY_SUBDOMAIN}.${row.domain}`);
      found = records.some((chunks) => chunks.join('') === expected);
    } catch {
      found = false;
    }

    const updated = await this.prisma.teacherCustomDomain.update({
      where: { teacherUid },
      data: {
        lastCheckedAt: new Date(),
        ...(found && !row.verified ? { verified: true, verifiedAt: new Date() } : {}),
      },
    });
    return this.toStatus(updated);
  }

  /** Used by the Next.js middleware to resolve an incoming custom-domain request
   * to the teacher whose profile it should show. Only verified domains resolve —
   * an unverified one must not be servable, since anyone could claim it in transit. */
  async resolveVerifiedDomain(host: string): Promise<string | null> {
    const domain = host.trim().toLowerCase().replace(/:\d+$/, '');
    const row = await this.prisma.teacherCustomDomain.findUnique({ where: { domain } });
    return row?.verified ? row.teacherUid : null;
  }

  /** For the server-side cert-issuance job: verified domains still waiting on a
   * certificate. */
  async listPendingCertificates(): Promise<string[]> {
    const rows = await this.prisma.teacherCustomDomain.findMany({
      where: { verified: true, certificateIssued: false },
      select: { domain: true },
    });
    return rows.map((r) => r.domain);
  }

  async markCertificateIssued(domain: string): Promise<void> {
    await this.prisma.teacherCustomDomain.updateMany({
      where: { domain: domain.toLowerCase() },
      data: { certificateIssued: true, certificateIssuedAt: new Date() },
    });
  }
}
