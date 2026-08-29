import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class ApproveContentDto {
  @IsInt()
  @Min(0)
  @Max(500)
  marginPercent: number;
}

export class RejectContentDto {
  @IsString()
  @MinLength(3)
  reason: string;
}

export class SetMarginDto {
  @IsInt()
  @Min(0)
  @Max(500)
  marginPercent: number;
}
