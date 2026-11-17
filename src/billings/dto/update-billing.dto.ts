import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateBillingDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  period_month?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(2000)
  period_year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  previous_meter?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  current_meter?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}
