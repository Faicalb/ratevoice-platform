import { IsString, IsEmail, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateAmbassadorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateAmbassadorStatusDto {
  @IsString()
  status: string;
}

export class UpdateAmbassadorServicesDto {
  @IsString({ each: true })
  services: string[];
}
