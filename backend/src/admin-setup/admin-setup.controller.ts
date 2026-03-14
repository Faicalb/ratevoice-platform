import { BadRequestException, Controller, ForbiddenException, Headers, Post, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('admin-setup')
export class AdminSetupController {
  private readonly logger = new Logger(AdminSetupController.name);

  constructor(private prisma: PrismaService) {}

  @Post()
  async setupAdmin(@Headers('x-admin-setup-token') token?: string) {
    const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
    const enabled = process.env.ALLOW_ADMIN_SETUP === 'true';
    if (!enabled) throw new ForbiddenException('Admin setup is disabled');
    if (env === 'production') {
      const expected = process.env.ADMIN_SETUP_TOKEN;
      if (!expected) throw new ForbiddenException('ADMIN_SETUP_TOKEN is required in production');
      if (!token || token !== expected) throw new ForbiddenException('Invalid setup token');
    }

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) throw new BadRequestException('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
    this.logger.log(`Checking for user: ${email}...`);

    // 1. Ensure SUPER_ADMIN role exists
    let superAdminRole = await this.prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
      this.logger.log('Creating SUPER_ADMIN role...');
      superAdminRole = await this.prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Super Administrator with full system access',
        },
      });
    }

    // 2. Find or Create User
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      this.logger.log('User not found. Creating new admin user...');
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);

      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: 'System Super Admin',
          isVerified: true,
          isAdmin: true,
          isActive: true,
          mustChangePassword: true,
        },
        include: { roles: true },
      });
      this.logger.log('User created.');
    } else {
      this.logger.log('User found. Updating permissions...');
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          isAdmin: true,
          isActive: true,
          mustChangePassword: true,
        },
        include: { roles: true },
      });
    }

    // 3. Assign Role if not already assigned
    const hasRole = user.roles.some((ur) => ur.roleId === superAdminRole!.id);
    if (!hasRole) {
      this.logger.log('Assigning SUPER_ADMIN role...');
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole!.id,
        },
      });
    } else {
      this.logger.log('User already has SUPER_ADMIN role.');
    }

    return {
      userId: user.id,
      roleAssigned: 'SUPER_ADMIN',
      superAdminAccessEnabled: true,
      accessibleRoutes: 'ALL (/admin/*, etc.)'
    };
  }
}
