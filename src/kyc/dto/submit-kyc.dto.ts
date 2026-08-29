import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const ID_TYPES = [
  'passport',
  'national_id',
  'drivers_license',
  'aadhaar',
] as const;

export type IdType = (typeof ID_TYPES)[number];

export class SubmitKycDto {
  @IsIn(ID_TYPES)
  idType: IdType;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  idNumber: string;
}
