import { IsEmail, IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class EmployeePermissionDto {
  @IsString()
  key: string;

  @IsBoolean()
  enabled: boolean;
}

export class CreateEmployeeDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  permissions?: EmployeePermissionDto[];
}
