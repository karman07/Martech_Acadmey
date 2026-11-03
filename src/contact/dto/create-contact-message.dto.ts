import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const ENQUIRY_TYPES = ['student', 'instructor', 'technical', 'other'] as const;

export class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsIn(ENQUIRY_TYPES)
  enquiryType: (typeof ENQUIRY_TYPES)[number];

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;

  /** Honeypot: real visitors never see or fill this field. */
  @IsOptional()
  @IsString()
  website?: string;
}
