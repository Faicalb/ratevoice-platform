import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  // Expanded categories
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  providerName: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  apiSecret?: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsNumber()
  @IsOptional()
  rateLimit?: number;

  @IsString()
  @IsOptional()
  fallbackProviderId?: string;

  @IsNumber()
  @IsOptional()
  costPerUnit?: number;
}

export class UpdateProviderDto {
  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  apiSecret?: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  fallbackProviderId?: string;

  @IsNumber()
  @IsOptional()
  costPerUnit?: number;
}
