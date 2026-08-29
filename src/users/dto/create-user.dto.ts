import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export type UserRole = 'student' | 'teacher';

export class CreateUserDto {
  @IsIn(['student', 'teacher'])
  role: UserRole;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  interest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  expertise?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  experience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  portfolio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  bio?: string;

  @IsOptional()
  @IsIn(['classic', 'editorial', 'minimal'])
  profileTemplate?: string;

  @IsOptional()
  @IsIn(['blue', 'emerald', 'violet', 'rose', 'amber', 'cyan', 'slate'])
  profileAccent?: string;

  @IsOptional()
  @IsIn(['grid', 'list', 'featured'])
  cardStyle?: string;

  @IsOptional()
  @Matches(HEX_COLOR, { message: 'profileBgLight must be a hex color, e.g. #fffbf0' })
  profileBgLight?: string;

  @IsOptional()
  @Matches(HEX_COLOR, { message: 'profileBgDark must be a hex color, e.g. #0a0a0a' })
  profileBgDark?: string;
}
