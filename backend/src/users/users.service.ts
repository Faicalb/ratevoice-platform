import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        wallet: true,
        businesses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: any) {
    const { email, password, role, ...rest } = data; // Prevent sensitive updates here
    
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: rest,
      include: {
        roles: { include: { role: true } },
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }
}