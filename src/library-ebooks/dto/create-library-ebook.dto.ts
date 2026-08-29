import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { parseTags } from '../../common/tags.util';

/** Text fields accompanying a multipart file upload (POST /library-ebooks). */
export class CreateLibraryEbookDto {
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
}
