import { IsIn } from 'class-validator';

const STATUSES = ['pending', 'processing', 'paid'];

export class UpdatePayoutStatusDto {
  @IsIn(STATUSES)
  status: 'pending' | 'processing' | 'paid';
}
