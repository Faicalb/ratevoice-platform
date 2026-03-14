import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  eventDate?: string;

  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT', 'ARCHIVED'])
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export class CreateNewsDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT', 'ARCHIVED'])
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

