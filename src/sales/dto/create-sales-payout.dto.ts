import { IsISO8601, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateSalesPayoutDto {
  @IsString()
  salesRepUid: string;

  @IsString()
  @MinLength(1)
  periodLabel: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @MinLength(1)
  method: string;

  @IsISO8601()
  dateISO: string;
}
