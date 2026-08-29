import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  value: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
