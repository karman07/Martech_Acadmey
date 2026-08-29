import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, readdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const AVATAR_ROOT = join(process.cwd(), 'uploads-public', 'avatars');
const AVATAR_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(uid: string, email: string | undefined, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { uid } });

    if (existing) {
      throw new ConflictException('Profile already exists');
    }

    return this.prisma.user.create({
      data: { uid, email: email ?? null, ...dto },
      include: { kyc: true },
    });
  }

  async findByUid(uid: string) {
    return this.prisma.user.findUnique({
      where: { uid },
      include: { kyc: true },
    });
  }

  async findMeOrThrow(uid: string) {
    const profile = await this.findByUid(uid);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(uid: string, dto: UpdateUserDto) {
    await this.findMeOrThrow(uid);

    return this.prisma.user.update({
      where: { uid },
      data: dto,
      include: { kyc: true },
    });
  }

  /** Keeps the stored phone number in sync once it's linked/verified on the Firebase Auth user. */
  async syncVerifiedPhone(uid: string, phoneNumber: string | undefined) {
    if (!phoneNumber) return;

    await this.prisma.user.updateMany({
      where: { uid },
      data: { phone: phoneNumber, phoneVerified: true },
    });
  }

  async updateAvatar(uid: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const extension = AVATAR_EXTENSION_BY_MIME[file.mimetype];

    if (!extension) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    await mkdir(AVATAR_ROOT, { recursive: true });

    // Remove any previous avatar for this user, whatever format it was in.
    const existing = await readdir(AVATAR_ROOT).catch(() => [] as string[]);
    await Promise.all(
      existing
        .filter((filename) => filename.startsWith(`${uid}.`))
        .map((filename) =>
          unlink(join(AVATAR_ROOT, filename)).catch(() => undefined),
        ),
    );

    const filename = `${uid}.${extension}`;
    await writeFile(join(AVATAR_ROOT, filename), file.buffer);

    const avatarPath = `avatars/${filename}`;
    return this.prisma.user.update({
      where: { uid },
      data: { avatarPath },
      include: { kyc: true },
    });
  }
}
