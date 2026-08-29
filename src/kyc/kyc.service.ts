import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

export type KycDocType = 'front' | 'back' | 'selfie';
export type KycFiles = Record<KycDocType, Express.Multer.File[] | undefined>;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const UPLOAD_ROOT = join(process.cwd(), 'uploads', 'kyc');

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(uid: string, dto: SubmitKycDto, files: KycFiles) {
    for (const docType of ['front', 'back', 'selfie'] as const) {
      if (!files[docType]?.[0]) {
        throw new BadRequestException(`Missing required document: ${docType}`);
      }
    }

    const paths: Record<KycDocType, string> = {} as Record<KycDocType, string>;

    for (const docType of ['front', 'back', 'selfie'] as const) {
      const file = files[docType]![0];
      paths[docType] = await this.saveDocument(uid, docType, file);
    }

    await this.prisma.kyc.upsert({
      where: { userUid: uid },
      update: {
        idType: dto.idType,
        idNumber: dto.idNumber,
        frontPath: paths.front,
        backPath: paths.back,
        selfiePath: paths.selfie,
        status: 'pending',
        rejectionReason: null,
        infoRequestNote: null,
        submittedAt: new Date(),
      },
      create: {
        userUid: uid,
        idType: dto.idType,
        idNumber: dto.idNumber,
        frontPath: paths.front,
        backPath: paths.back,
        selfiePath: paths.selfie,
      },
    });

    return this.getStatus(uid);
  }

  async getStatus(uid: string) {
    const kyc = await this.prisma.kyc.findUnique({ where: { userUid: uid } });
    return kyc ?? { status: 'unsubmitted' as const };
  }

  // -- Admin moderation --

  findAllForAdmin(status?: string) {
    return this.prisma.kyc.findMany({
      where: status ? { status: status as never } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async approve(userUid: string) {
    await this.findOneOrThrow(userUid);
    return this.prisma.kyc.update({
      where: { userUid },
      data: { status: 'approved', rejectionReason: null, infoRequestNote: null },
    });
  }

  async reject(userUid: string, reason: string) {
    await this.findOneOrThrow(userUid);
    return this.prisma.kyc.update({
      where: { userUid },
      data: { status: 'rejected', rejectionReason: reason, infoRequestNote: null },
    });
  }

  async requestInfo(userUid: string, note: string) {
    await this.findOneOrThrow(userUid);
    return this.prisma.kyc.update({
      where: { userUid },
      data: { status: 'info_requested', infoRequestNote: note, rejectionReason: null },
    });
  }

  async getDocumentPath(userUid: string, docType: string) {
    if (!['front', 'back', 'selfie'].includes(docType)) {
      throw new BadRequestException('Unknown document type');
    }
    const kyc = await this.findOneOrThrow(userUid);
    const relativePath = { front: kyc.frontPath, back: kyc.backPath, selfie: kyc.selfiePath }[
      docType as KycDocType
    ];
    return join(process.cwd(), 'uploads', relativePath);
  }

  private async findOneOrThrow(userUid: string) {
    const kyc = await this.prisma.kyc.findUnique({ where: { userUid } });
    if (!kyc) {
      throw new NotFoundException('KYC submission not found');
    }
    return kyc;
  }

  private async saveDocument(
    uid: string,
    docType: KycDocType,
    file: Express.Multer.File,
  ) {
    const extension = EXTENSION_BY_MIME[file.mimetype];

    if (!extension) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const userDir = join(UPLOAD_ROOT, uid);
    await mkdir(userDir, { recursive: true });

    const filename = `${docType}-${Date.now()}.${extension}`;
    await writeFile(join(userDir, filename), file.buffer);

    return join('kyc', uid, filename);
  }
}
