import { IsNumber, IsPositive } from 'class-validator';

export class AddFundsDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
