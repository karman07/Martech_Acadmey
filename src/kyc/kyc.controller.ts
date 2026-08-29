import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { KycService } from './kyc.service';
import type { KycFiles } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Controller('users/me/kyc')
@UseGuards(FirebaseAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      {
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, callback) => {
          if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            callback(
              new BadRequestException(
                `Unsupported file type: ${file.mimetype}`,
              ),
              false,
            );
            return;
          }
          callback(null, true);
        },
      },
    ),
  )
  submit(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: SubmitKycDto,
    @UploadedFiles() files: KycFiles,
  ) {
    return this.kycService.submit(user.uid, dto, files);
  }

  @Get()
  getStatus(@CurrentUser() user: DecodedIdToken) {
    return this.kycService.getStatus(user.uid);
  }
}
