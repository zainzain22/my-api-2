import { IsIn } from 'class-validator';

export class VerifyPaymentDto {
  @IsIn(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';
}
