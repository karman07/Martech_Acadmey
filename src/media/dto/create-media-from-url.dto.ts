import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { MediaType } from '@prisma/client';
import { parseTags } from '../../common/tags.util';

const MEDIA_TYPES: MediaType[] = ['video', 'audio', 'image', 'document'];

/** Body for registering an externally-hosted video/asset (POST /media/url). */
export class CreateMediaFromUrlDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => parseTags(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsIn(MEDIA_TYPES)
  type?: MediaType;
}
