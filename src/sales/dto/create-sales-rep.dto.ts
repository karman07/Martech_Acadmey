import { IsEmail, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateSalesRepDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent: number;
}
