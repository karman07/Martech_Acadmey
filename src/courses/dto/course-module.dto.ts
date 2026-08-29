import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCourseModuleDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateCourseModuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
