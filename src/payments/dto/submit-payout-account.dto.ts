import { IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitPayoutAccountDto {
  @IsString()
  @MinLength(3)
  legalName: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsString()
  @MinLength(3)
  addressLine: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(2)
  state: string;

  @IsString()
  @MinLength(4)
  postalCode: string;

  @IsString()
  @MinLength(3)
  accountHolderName: string;

  @IsString()
  @MinLength(6)
  accountNumber: string;

  @IsString()
  @MinLength(8)
  ifsc: string;

  @IsOptional()
  @IsString()
  upiVpa?: string;
}
