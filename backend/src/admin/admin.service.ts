import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    const [totalUsers, totalBusinesses, totalReviews, totalBookings, revenueData] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.business.count(),
      this.prisma.textReview.count(), // + voiceReview count if needed
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true }
      })
    ]);

    return {
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalBookings,
      totalRevenue: Number(revenueData._sum.totalAmount) || 0
    };
  }

  // --- USER MANAGEMENT ---
  async getAllUsers(skip = 0, take = 50) {
    return this.prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { roles: { include: { role: true } } }
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(data: any) {
    const { email, password, role, membership, points, status, ...rest } = data;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure Role Exists
    let roleRecord = await this.prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) {
      if (role === 'SUPER_ADMIN') {
         roleRecord = await this.prisma.role.create({
            data: { name: 'SUPER_ADMIN', description: 'Super Administrator with full access' }
         });
      } else {
         // Try to fallback to USER if specific role not found
         roleRecord = await this.prisma.role.findUnique({ where: { name: 'USER' } });
         if (!roleRecord) {
            // Create USER role if even that is missing (seeding fallback)
            roleRecord = await this.prisma.role.create({
               data: { name: 'USER', description: 'Standard User' }
            });
         }
      }
    }

    // Try to create user
    try {
      const user = await this.prisma.user.create({
        data: {
          // Explicitly map known fields to avoid 'rest' containing invalid fields like 'membership' if not in schema
          email,
          passwordHash: hashedPassword,
          fullName: rest.name || rest.fullName,
          isActive: status === 'active',
          currentPoints: Number(points) || 0,
          // Handle potential extra fields gracefully or ignore them
          // membership field is NOT in User model based on schema.prisma check
          roles: {
            create: { roleId: roleRecord.id }
          },
          wallet: { 
            create: { 
              balance: 0,
              currency: 'USD'
            } 
          }
        },
        include: { 
          roles: { include: { role: true } }, 
          wallet: true 
        }
      });

      const { passwordHash: pwd, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error('Create user failed');
      throw new BadRequestException('Failed to create user');
    }
  }

  async updateUser(id: string, data: any) {
    const { password, role, ...rest } = data;
    const updateData: any = { ...rest };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (role) {
      const roleRecord = await this.prisma.role.findUnique({ where: { name: role } });
      if (roleRecord) {
        // Remove existing roles and assign new one (simplified role management)
        await this.prisma.userRole.deleteMany({ where: { userId: id } });
        await this.prisma.userRole.create({
          data: { userId: id, roleId: roleRecord.id }
        });
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { roles: { include: { role: true } } }
    });
  }

  async deleteUser(id: string) {
    // Soft delete or hard delete depending on policy. Using hard delete for now as per previous implementation
    return this.prisma.user.delete({ where: { id } });
  }

  async banUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // --- BUSINESS MANAGEMENT ---
  async getAllBusinesses(skip = 0, take = 50) {
    return this.prisma.business.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { owner: true }
    });
  }

  async updateBusinessStatus(id: string, status: string) {
    return this.prisma.business.update({
      where: { id },
      data: { status }
    });
  }

  // --- REVIEWS MODERATION ---
  async getAllReviews(skip = 0, take = 50) {
    // Fetch both text and voice reviews
    const [textReviews, voiceReviews] = await Promise.all([
      this.prisma.textReview.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: true, branch: true }
      }),
      this.prisma.voiceReview.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: true, branch: true }
      })
    ]);

    // Merge and sort
    const allReviews = [...textReviews, ...voiceReviews].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return allReviews.slice(0, take);
  }

  async deleteReview(id: string) {
    // Try text review first
    try {
      return await this.prisma.textReview.delete({ where: { id } });
    } catch {
      // Try voice review
      return await this.prisma.voiceReview.delete({ where: { id } });
    }
  }

  // --- POINTS & REWARDS ---
  async rewardUser(userId: string, amount: number, reason: string) {
    // Update User Points
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentPoints: { increment: amount } }
    });

    // Also update Wallet Balance (assuming 1 point = $1 or similar, simplified)
    // Or maybe just points? The prompt says "Give Points"
    // Let's stick to Points Ledger logic if it exists, or just User.currentPoints
    
    // Also log in PointsLedger if available
    await this.prisma.pointsLedger.create({
      data: {
        userId,
        points: amount,
        reason
      }
    });

    return { success: true, message: `Added ${amount} points to user ${userId}` };
  }
}
