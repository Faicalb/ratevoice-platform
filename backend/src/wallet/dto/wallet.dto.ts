import { IsNumber, IsPositive, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class RewardDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  amount: number; // Can be negative for deduction

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
