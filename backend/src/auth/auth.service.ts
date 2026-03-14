import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        phoneNumber: registerDto.phoneNumber,
        // Assign default USER role
        roles: {
            create: {
                role: {
                    connectOrCreate: {
                        where: { name: 'USER' },
                        create: { name: 'USER', description: 'Regular User' }
                    }
                }
            }
        }
      },
      include: {
          roles: true
      }
    });

    const { passwordHash: p, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ctx?: { ipAddress?: string | null; userAgent?: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !user.passwordHash) {
      await this.prisma.securityEvent.create({
        data: {
          userId: user?.id ?? null,
          eventType: 'FAILED_LOGIN',
          ipAddress: ctx?.ipAddress ?? null,
          details: 'Invalid credentials',
          severity: 'MEDIUM'
        }
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      await this.prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'FAILED_LOGIN',
          ipAddress: ctx?.ipAddress ?? null,
          details: 'Invalid credentials',
          severity: 'MEDIUM'
        }
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map(ur => ur.role.name);

    const payload = { 
      email: user.email, 
      sub: user.id,
      roles: roles,
      mustChangePassword: user.mustChangePassword 
    };
    const accessToken = this.jwtService.sign(payload);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    await this.prisma.loginSession.create({
      data: {
        userId: user.id,
        token: tokenHash,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ? String(ctx.userAgent) : null,
        expiresAt,
        isValid: true
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        details: {
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ? String(ctx.userAgent) : null
        }
      }
    });

    return {
      access_token: accessToken,
      user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: roles,
          mustChangePassword: user.mustChangePassword
      }
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false }
      });
      await tx.auditLog.create({
        data: { userId, action: 'PASSWORD_CHANGE', resource: 'AUTH', details: {} }
      });
    });

    return { success: true };
  }
}
