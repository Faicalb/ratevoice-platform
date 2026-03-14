import { IsNumber, IsString, IsOptional } from 'class-validator';

export class AddBalanceDto {
  @IsNumber()
  amount: number;

  @IsString()
  reason: string;
}

export class RequestWithdrawalDto {
  @IsNumber()
  amount: number;

  @IsString()
  method: string;
}

export class ApproveWithdrawalDto {
  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
