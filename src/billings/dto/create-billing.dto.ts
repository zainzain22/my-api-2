import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class CreateBillingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  electricity_account_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  period_month: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  period_year: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  previous_meter: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  current_meter: number;

  @IsDateString()
  due_date: string;
}
