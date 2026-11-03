import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const WIDTHS = ['narrow', 'medium', 'wide', 'full'];
const COURSE_TEMPLATES = ['classic', 'editorial', 'minimal'];
const COURSE_ACCENTS = [
  'clay',
  'blue',
  'emerald',
  'violet',
  'rose',
  'amber',
  'cyan',
  'slate',
];

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  summary: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsIn(WIDTHS)
  descriptionWidth?: string;

  @IsOptional()
  @IsString()
  previewVideoUrl?: string;

  @IsString()
  categorySlug: string;

  @IsIn(LEVELS)
  level: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  learningOutcomes?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  prerequisites?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  audience?: string;

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
  @IsIn(COURSE_TEMPLATES)
  courseTemplate?: string;

  @IsOptional()
  @IsIn(COURSE_TEMPLATES)
  playerTemplate?: string;

  @IsOptional()
  @IsBoolean()
  hideLessonNavbar?: boolean;

  @IsOptional()
  @IsIn(COURSE_ACCENTS)
  courseAccent?: string;
}
