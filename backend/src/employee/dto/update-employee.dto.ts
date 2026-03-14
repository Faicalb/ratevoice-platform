import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { EmployeePermissionDto } from './create-employee.dto';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'INVITED', 'REMOVED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'REMOVED';

  @IsOptional()
  @IsArray()
  permissions?: EmployeePermissionDto[];
}

