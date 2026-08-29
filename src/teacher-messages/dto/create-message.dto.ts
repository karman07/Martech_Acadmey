import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  senderName: string;

  @IsEmail()
  senderEmail: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
