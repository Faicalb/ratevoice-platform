import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export function getPagination(dto: PaginationDto) {
  const page = dto.page || 1;
  const limit = dto.limit || 20;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
