import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AnalyzeReviewDto {
  @IsString()
  @IsNotEmpty()
  reviewId: string;

  @IsString()
  @IsNotEmpty()
  transcription: string;

  @IsString()
  @IsOptional()
  language?: string;
}
