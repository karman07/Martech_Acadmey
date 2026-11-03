import { IsOptional, IsString } from 'class-validator';

/** Any field left out of the request body is untouched. An empty string clears that field. */
export class UpdatePayoutSettingsDto {
  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;
}
