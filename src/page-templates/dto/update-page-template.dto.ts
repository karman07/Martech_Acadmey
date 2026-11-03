import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreatePageTemplateDto } from './create-page-template.dto';

export class UpdatePageTemplateDto extends PartialType(CreatePageTemplateDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
