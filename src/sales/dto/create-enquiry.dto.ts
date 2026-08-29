import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEnquiryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  interest?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
