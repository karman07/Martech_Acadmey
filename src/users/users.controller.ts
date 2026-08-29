import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@CurrentUser() user: DecodedIdToken, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.uid, user.email, dto);
  }

  @Get('me')
  async findMe(@CurrentUser() user: DecodedIdToken) {
    await this.usersService.syncVerifiedPhone(user.uid, user.phone_number);
    return this.usersService.findMeOrThrow(user.uid);
  }

  @Patch('me')
  update(@CurrentUser() user: DecodedIdToken, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.uid, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: MAX_AVATAR_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: DecodedIdToken,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(user.uid, file);
  }
}
