import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CompensateDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  reason: string;
}

