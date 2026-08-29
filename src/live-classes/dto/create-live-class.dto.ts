import { Transform } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
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

  @IsString()
  url: string;
}
