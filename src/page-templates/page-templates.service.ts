import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/pricing.util';
import { CreatePageTemplateDto } from './dto/create-page-template.dto';
import { UpdatePageTemplateDto } from './dto/update-page-template.dto';

/** Admin-authored templates are trusted markup — this allowlist is defense-in-depth against a
 * mistake or a compromised admin account, not the primary security boundary. */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'div', 'section', 'header', 'footer', 'nav', 'main', 'article', 'aside', 'figure', 'figcaption',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'img', 'br', 'hr',
    'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'small', 'blockquote', 'button', 'label',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'linearGradient', 'stop',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'title', 'aria-*', 'data-*', 'role'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    svg: ['viewbox', 'width', 'height', 'fill', 'xmlns', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'fill', 'stroke'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke'],
    polyline: ['points', 'fill', 'stroke'],
    polygon: ['points', 'fill', 'stroke'],
    linearGradient: ['id', 'x1', 'y1', 'x2', 'y2'],
    stop: ['offset', 'stop-color', 'stop-opacity'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  disallowedTagsMode: 'discard',
};

@Injectable()
export class PageTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(template: {
    id: string;
    key: string;
    name: string;
    description: string;
    htmlSource: string;
    isActive: boolean;
    createdByUid: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: template.id,
      key: template.key,
      name: template.name,
      description: template.description,
      htmlSource: template.htmlSource,
      isActive: template.isActive,
      createdByUid: template.createdByUid,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private async uniqueKey(base: string) {
    const slug = slugify(base);
    let candidate = slug;
    let suffix = 2;
    while (await this.prisma.pageTemplate.findUnique({ where: { key: candidate } })) {
      candidate = `${slug}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(adminUid: string, dto: CreatePageTemplateDto) {
    const key = dto.key ? slugify(dto.key) : await this.uniqueKey(dto.name);
    const template = await this.prisma.pageTemplate.create({
      data: {
        key,
        name: dto.name,
        description: dto.description ?? '',
        htmlSource: sanitizeHtml(dto.htmlSource, SANITIZE_OPTIONS),
        createdByUid: adminUid,
      },
    });
    return this.map(template);
  }

  async findAllForAdmin() {
    const templates = await this.prisma.pageTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return templates.map((t) => this.map(t));
  }

  async findOneForAdmin(id: string) {
    const template = await this.prisma.pageTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return this.map(template);
  }

  async update(id: string, dto: UpdatePageTemplateDto) {
    await this.findOneForAdmin(id);
    const template = await this.prisma.pageTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        htmlSource: dto.htmlSource ? sanitizeHtml(dto.htmlSource, SANITIZE_OPTIONS) : undefined,
        isActive: dto.isActive,
        ...(dto.key ? { key: slugify(dto.key) } : {}),
      },
    });
    return this.map(template);
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);
    await this.prisma.pageTemplate.delete({ where: { id } });
  }

  async findAllActive() {
    const templates = await this.prisma.pageTemplate.findMany({
      where: { isActive: true },
      select: { key: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
    return templates;
  }

  async existsActive(key: string) {
    const template = await this.prisma.pageTemplate.findUnique({
      where: { key },
      select: { isActive: true },
    });
    return Boolean(template?.isActive);
  }

  async renderForInstructor(key: string, instructorData: Record<string, unknown>) {
    const template = await this.prisma.pageTemplate.findUnique({ where: { key } });
    if (!template || !template.isActive) {
      throw new NotFoundException('Template not found');
    }

    let compiled: string;
    try {
      const fn = Handlebars.compile(template.htmlSource, { noEscape: false, strict: false });
      compiled = fn(instructorData);
    } catch {
      throw new BadRequestException('This template could not be rendered.');
    }

    return { html: sanitizeHtml(compiled, SANITIZE_OPTIONS) };
  }
}
