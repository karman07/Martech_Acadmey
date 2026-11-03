import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEbookDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsString()
  coverFrom: string;

  @IsString()
  coverTo: string;

  /** The PDF/DOCX this listing sells — picked from the teacher's library. */
  @IsString()
  libraryEbookId: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSizeMB?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previewParagraphs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fullParagraphs?: string[];
}
