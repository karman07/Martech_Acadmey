import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherPageDto } from './create-teacher-page.dto';

export class UpdateTeacherPageDto extends PartialType(CreateTeacherPageDto) {}
