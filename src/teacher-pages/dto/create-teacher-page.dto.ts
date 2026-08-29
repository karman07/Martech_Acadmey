import { IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class CreateTeacherPageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  navLabel?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
