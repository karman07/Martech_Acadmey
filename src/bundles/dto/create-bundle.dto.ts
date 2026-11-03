import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const BADGES = ['Best seller', 'New', 'Staff pick'];

export class CreateBundleDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  courseIds: string[];

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

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsIn(BADGES)
  badge?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsString()
  audience?: string;
}
