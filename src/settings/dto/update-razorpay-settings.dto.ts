import { IsOptional, IsString } from 'class-validator';

/** Any field left out of the request body is untouched. An empty string clears that field
 * (falls back to .env, or to unconfigured if .env has nothing either). */
export class UpdateRazorpaySettingsDto {
  @IsOptional()
  @IsString()
  keyId?: string;

  @IsOptional()
  @IsString()
  keySecret?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
