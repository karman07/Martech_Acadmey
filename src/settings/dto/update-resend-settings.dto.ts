import { IsOptional, IsString } from 'class-validator';

/** Any field left out of the request body is untouched. An empty string clears that field
 * (falls back to .env for apiKey, or to Resend's sandbox address for fromEmail). */
export class UpdateResendSettingsDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  fromEmail?: string;
}
