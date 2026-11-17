import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateElectricityServiceDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  power_va: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_per_kwh: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
