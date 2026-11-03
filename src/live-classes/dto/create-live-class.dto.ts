import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { parseTags } from '../../common/tags.util';

export class CreateLiveClassDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => parseTags(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsISO8601()
  dateISO: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  durationMinutes?: number;

  /** Whether to auto-create the meeting via Zoom. Falls back to the manually-provided `url`
   * if Zoom isn't configured or the call fails — never blocks creating the session. */
  @IsOptional()
  @IsBoolean()
  useZoom?: boolean;

  @IsOptional()
  @IsString()
  url?: string;
}
