import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateElectricityServiceDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  power_va?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_per_kwh?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
