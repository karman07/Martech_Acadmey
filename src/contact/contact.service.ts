import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const TYPE_LABELS: Record<string, string> = {
  student: 'Student enquiry',
  instructor: 'Instructor enquiry',
  technical: 'Technical issue',
  other: 'Other',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

@Injectable()
export class ContactService {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** In-memory per-IP limit — enough to blunt form spam on a single instance. */
  private assertWithinRateLimit(ip: string) {
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
      throw new HttpException('Too many messages. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.hits.set(ip, recent);
  }

  async create(dto: CreateContactMessageDto, ip: string) {
    // A filled honeypot means a bot: pretend success, store nothing.
    if (dto.website) return { ok: true };

    this.assertWithinRateLimit(ip);

    await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim(),
        enquiryType: dto.enquiryType,
        message: dto.message.trim(),
      },
    });

    // Routing: one inbox per enquiry type when configured, otherwise the general inbox.
    const to =
      process.env[`CONTACT_TO_EMAIL_${dto.enquiryType.toUpperCase()}`] || process.env.CONTACT_TO_EMAIL;
    if (to) {
      await this.mail.send({
        to,
        subject: `[Martech Academy] ${TYPE_LABELS[dto.enquiryType]} from ${dto.name}`,
        html: `<p><strong>${escapeHtml(dto.name)}</strong> (${escapeHtml(dto.email)})</p>
<p>${TYPE_LABELS[dto.enquiryType]}</p>
<p>${escapeHtml(dto.message).replace(/\n/g, '<br>')}</p>`,
      });
    }

    return { ok: true };
  }

  findAll() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
  }
}
