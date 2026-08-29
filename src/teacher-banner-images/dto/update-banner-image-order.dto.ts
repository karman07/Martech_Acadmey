import { IsInt, Min } from 'class-validator';

export class UpdateBannerImageOrderDto {
  @IsInt()
  @Min(0)
  order: number;
}
