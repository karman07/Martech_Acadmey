import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const CONTENT_TYPES = ['course', 'ebook', 'bootcamp', 'bundle'];

export class EnrollStudentDto {
  @IsString()
  @MinLength(2)
  studentName: string;

  @IsEmail()
  studentEmail: string;

  @IsOptional()
  @IsString()
  studentPhone?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(CONTENT_TYPES)
  type: 'course' | 'ebook' | 'bootcamp' | 'bundle';

  @IsString()
  refId: string;
}
