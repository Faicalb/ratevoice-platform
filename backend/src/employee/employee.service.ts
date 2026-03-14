import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBusinessByOwner(ownerId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async listForOwner(ownerId: string) {
    const business = await this.getBusinessByOwner(ownerId);
    const employees = await this.prisma.businessEmployee.findMany({
      where: { businessId: business.id, status: { not: 'REMOVED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true, avatarUrl: true, phoneNumber: true, isActive: true, mustChangePassword: true } },
        permissions: true
      }
    });
    return employees;
  }

  async listActivityForOwner(ownerId: string) {
    const business = await this.getBusinessByOwner(ownerId);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        userId: ownerId,
        OR: [{ resource: 'EMPLOYEE' }, { action: { contains: 'EMPLOYEE' } }]
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return logs.map((l: any) => ({
      id: l.id,
      employeeId: l.details?.employeeId || '',
      employeeName: l.details?.email || '',
      action: l.action,
      details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
      timestamp: l.createdAt.toISOString(),
      ipAddress: l.details?.ip || l.details?.ipAddress || ''
    }));
  }

  async createForOwner(ownerId: string, input: { email: string; name: string; roleTitle?: string; phone?: string; department?: string; password?: string; permissions?: { key: string; enabled: boolean }[] }) {
    const business = await this.getBusinessByOwner(ownerId);
    const email = input.email.trim().toLowerCase();
    if (!email) throw new BadRequestException('Email is required');

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      let tempPassword: string | null = null;

      if (!user) {
        tempPassword = input.password ? null : Math.random().toString(36).slice(-10);
        const rawPassword = input.password || tempPassword;
        if (!rawPassword) throw new BadRequestException('Password generation failed');
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        user = await tx.user.create({
          data: {
            email,
            passwordHash,
            fullName: input.name,
            phoneNumber: input.phone || null,
            isVerified: false,
            isActive: true,
            mustChangePassword: true
          }
        });
      } else if (input.phone && !user.phoneNumber) {
        await tx.user.update({ where: { id: user.id }, data: { phoneNumber: input.phone } });
      }

      let role = await tx.role.findUnique({ where: { name: 'BUSINESS_EMPLOYEE' } });
      if (!role) {
        role = await tx.role.create({ data: { name: 'BUSINESS_EMPLOYEE', description: 'Business employee account' } });
      }
      const existingRole = await tx.userRole.findFirst({ where: { userId: user.id, roleId: role.id, branchId: null } });
      if (!existingRole) {
        await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
      }

      const employee = await tx.businessEmployee.upsert({
        where: { businessId_userId: { businessId: business.id, userId: user.id } },
        create: {
          businessId: business.id,
          userId: user.id,
          roleTitle: input.roleTitle || null,
          status: 'INVITED',
          invitedBy: ownerId
        },
        update: {
          roleTitle: input.roleTitle || null,
          status: 'INVITED',
          invitedBy: ownerId
        }
      });

      if (input.permissions?.length) {
        for (const p of input.permissions) {
          await tx.employeePermission.upsert({
            where: { employeeId_key: { employeeId: employee.id, key: p.key } },
            create: { employeeId: employee.id, key: p.key, enabled: !!p.enabled },
            update: { enabled: !!p.enabled }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: 'EMPLOYEE_INVITE',
          resource: 'EMPLOYEE',
          details: { businessId: business.id, employeeId: employee.id, userId: user.id, email }
        }
      });

      return { employeeId: employee.id, userId: user.id, email, tempPassword: tempPassword || '' };
    });
  }

  async updateForOwner(ownerId: string, employeeId: string, input: { roleTitle?: string; status?: string; permissions?: { key: string; enabled: boolean }[] }) {
    const business = await this.getBusinessByOwner(ownerId);

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.businessEmployee.findUnique({ where: { id: employeeId } });
      if (!employee || employee.businessId !== business.id) throw new NotFoundException('Employee not found');

      const updated = await tx.businessEmployee.update({
        where: { id: employeeId },
        data: {
          roleTitle: input.roleTitle ?? employee.roleTitle,
          status: input.status ? (input.status as any) : employee.status
        }
      });

      if (input.permissions?.length) {
        for (const p of input.permissions) {
          await tx.employeePermission.upsert({
            where: { employeeId_key: { employeeId: employee.id, key: p.key } },
            create: { employeeId: employee.id, key: p.key, enabled: !!p.enabled },
            update: { enabled: !!p.enabled }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: 'EMPLOYEE_UPDATE',
          resource: 'EMPLOYEE',
          details: { businessId: business.id, employeeId, status: input.status || null }
        }
      });

      return updated;
    });
  }

  async removeForOwner(ownerId: string, employeeId: string) {
    const business = await this.getBusinessByOwner(ownerId);
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.businessEmployee.findUnique({ where: { id: employeeId } });
      if (!employee || employee.businessId !== business.id) throw new NotFoundException('Employee not found');

      const updated = await tx.businessEmployee.update({
        where: { id: employeeId },
        data: { status: 'REMOVED' }
      });

      await tx.auditLog.create({
        data: { userId: ownerId, action: 'EMPLOYEE_REMOVE', resource: 'EMPLOYEE', details: { businessId: business.id, employeeId } }
      });
      return updated;
    });
  }

  async adminList(skip = 0, take = 50) {
    return this.prisma.businessEmployee.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        business: { select: { id: true, name: true, ownerId: true, status: true } },
        user: { select: { id: true, email: true, fullName: true, isActive: true } },
        permissions: true
      }
    });
  }

  async adminUpdateStatus(adminId: string, employeeId: string, status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'REMOVED') {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.businessEmployee.update({ where: { id: employeeId }, data: { status } });
      await tx.auditLog.create({ data: { userId: adminId, action: 'ADMIN_EMPLOYEE_STATUS', resource: 'EMPLOYEE', details: { employeeId, status } } });
      return employee;
    });
  }
}
