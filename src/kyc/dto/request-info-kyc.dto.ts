import { IsString, MinLength } from 'class-validator';

export class RequestInfoKycDto {
  @IsString()
  @MinLength(3)
  note: string;
}
