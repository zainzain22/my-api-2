import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateBillingDto {
  @IsUUID('4')
  subscription_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  period_month: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  period_year: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsDateString()
  due_date: string;
}
