import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePageTemplateDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  htmlSource: string;
}
