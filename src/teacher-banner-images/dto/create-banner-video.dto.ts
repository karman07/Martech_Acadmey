import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBannerVideoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  videoUrl: string;
}
