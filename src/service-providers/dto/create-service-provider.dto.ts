import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceProviderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  speed: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_per_month: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
