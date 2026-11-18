import { IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID('4')
  service_provider_id: string;
}
