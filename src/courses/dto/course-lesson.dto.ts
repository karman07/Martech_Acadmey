import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const LESSON_TYPES = ['video', 'document', 'link', 'quiz'];

export class CreateCourseLessonDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsIn(LESSON_TYPES)
  type: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsOptional()
  @IsString()
  quizId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateCourseLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsIn(LESSON_TYPES)
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  /** `null` clears it — an empty string would violate the FK/be a broken link. */
  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsString()
  mediaId?: string | null;

  @IsOptional()
  @IsString()
  quizId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
