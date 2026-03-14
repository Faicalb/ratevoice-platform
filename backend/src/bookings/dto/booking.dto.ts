import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsOptional()
  branchId?: string; // Optional if business has single branch

  @IsDateString()
  date: string; // ISO Date String

  @IsNumber()
  guests: number;

  @IsString()
  @IsOptional()
  roomType?: string; // e.g. "Standard", "Deluxe"

  @IsNumber()
  price: number;
}

export class UpdateBookingDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
