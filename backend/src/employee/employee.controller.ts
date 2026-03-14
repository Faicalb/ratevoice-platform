import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('business/employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async list(@Request() req) {
    return this.employeeService.listForOwner(req.user.id);
  }

  @Get('business/employees/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async activity(@Request() req) {
    return this.employeeService.listActivityForOwner(req.user.id);
  }

  @Post('business/employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async create(@Request() req, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.createForOwner(req.user.id, dto);
  }

  @Patch('business/employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.updateForOwner(req.user.id, id, dto);
  }

  @Delete('business/employees/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async remove(@Request() req, @Param('id') id: string) {
    return this.employeeService.removeForOwner(req.user.id, id);
  }

  @Get('admin/employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminList(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.employeeService.adminList(Number(skip || 0), Number(take || 50));
  }

  @Patch('admin/employees/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminStatus(@Request() req, @Param('id') id: string, @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'REMOVED') {
    return this.employeeService.adminUpdateStatus(req.user.id, id, status);
  }
}
