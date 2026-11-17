import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateElectricityAccountDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  electricity_service_id: number;

  @IsString()
  @IsNotEmpty()
  customer_number: string;

  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
