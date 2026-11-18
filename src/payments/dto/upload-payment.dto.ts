import { IsUUID } from 'class-validator';

export class UploadPaymentDto {
  @IsUUID('4')
  billing_id: string;
}
