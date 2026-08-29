import { IsIn } from 'class-validator';

const STATUSES = ['pending', 'processing', 'paid'];

export class UpdateSalesPayoutStatusDto {
  @IsIn(STATUSES)
  status: 'pending' | 'processing' | 'paid';
}
