import { IsIn, IsString } from 'class-validator';

const TYPES = ['course', 'ebook', 'bootcamp', 'bundle'];

export class CreateOrderDto {
  @IsIn(TYPES)
  type: 'course' | 'ebook' | 'bootcamp' | 'bundle';

  @IsString()
  refId: string;
}
