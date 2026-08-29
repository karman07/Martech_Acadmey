import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  excerpt: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body: string;
}
