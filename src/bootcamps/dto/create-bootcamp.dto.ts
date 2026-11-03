import {
  IsArray,
  IsIn,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const FORMATS = ['Live Online', 'Hybrid', 'In-Person'];

export class CreateBootcampDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  tagline: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsIn(FORMATS)
  format: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsInt()
  @Min(1)
  durationWeeks: number;

  @IsInt()
  @Min(1)
  cohortSize: number;

  @IsISO8601()
  nextCohortDate: string;

  @IsISO8601()
  applicationDeadline: string;

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
  @IsInt()
  @Min(0)
  hoursPerWeek?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outcomes?: string[];

  @IsOptional()
  @IsArray()
  modules?: { title: string; weeks: string; topics: string[] }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  admissionRequirements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careerSupport?: string[];
}
