import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';
import { AddBalanceDto, RequestWithdrawalDto, ApproveWithdrawalDto } from './dto/wallet.dto';

@Injectable()
export class AmbassadorService {
    private readonly logger = new Logger(AmbassadorService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService
    ) {}

    // --------------------------------------------------------------------------------
    // PROFILE MANAGEMENT
    // --------------------------------------------------------------------------------

    async createProfile(userId: string, referralCode?: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Check existing profile
        const existingProfile = await this.prisma.ambassador.findUnique({ where: { userId } });
        if (existingProfile) throw new ConflictException('User already has an ambassador profile');

        // Generate unique code if not provided
        const code = referralCode || `REF-${userId.substring(0, 4).toUpperCase()}-${Date.now().toString().substring(8)}`;

        const existingCode = await this.prisma.ambassador.findUnique({ where: { referralCode: code } });
        if (existingCode) throw new ConflictException('Referral code already taken');

        // Populate basic details from User if not provided manually later
        return this.prisma.ambassador.create({
            data: {
                userId,
                name: user.fullName || 'Ambassador',
                email: user.email,
                phone: user.phoneNumber || '',
                referralCode: code,
                commissionRate: 0.05 // 5% default
            }
        });
    }

    async createManualAmbassador(dto: CreateAmbassadorDto) {
        // Generate code
        const code = `REF-${dto.name.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(8)}`;

        return this.prisma.ambassador.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                country: dto.country,
                city: dto.city,
                referralCode: code,
                commissionRate: dto.commissionRate || 0.05,
                level: dto.level || 'BRONZE',
                status: dto.status || 'ACTIVE',
                userId: dto.userId || undefined // Optional link to existing user
            }
        });
    }

    async getProfile(userId: string) {
        return this.prisma.ambassador.findUnique({ where: { userId } });
    }
    
    async getAllAmbassadors() {
        return this.prisma.ambassador.findMany({
            include: {
                services: true,
                withdrawals: true,
                _count: {
                    select: { services: true } // In real scenario count referrals too if relation existed
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateStatus(id: string, status: string) {
        await this.logActivity(id, 'STATUS_UPDATE', `Status changed to ${status}`);
        return this.prisma.ambassador.update({
            where: { id },
            data: { status }
        });
    }

    // --------------------------------------------------------------------------------
    // WALLET & WITHDRAWALS
    // --------------------------------------------------------------------------------

    async getWallet(id: string) {
        const ambassador = await this.prisma.ambassador.findUnique({
            where: { id },
            select: { balance: true, commissionRate: true, level: true }
        });
        if (!ambassador) throw new NotFoundException('Ambassador not found');

        // Calculate stats
        const withdrawals = await this.prisma.withdrawalRequest.aggregate({
            where: { ambassadorId: id, status: 'APPROVED' },
            _sum: { amount: true }
        });

        const pending = await this.prisma.withdrawalRequest.aggregate({
            where: { ambassadorId: id, status: 'PENDING' },
            _sum: { amount: true }
        });

        return {
            currentBalance: ambassador.balance,
            totalWithdrawn: withdrawals._sum.amount || 0,
            pendingWithdrawal: pending._sum.amount || 0,
            totalEarned: ambassador.balance + (withdrawals._sum.amount || 0) // Simple calculation
        };
    }

    async addBalance(id: string, dto: AddBalanceDto, adminId?: string) {
        const ambassador = await this.prisma.ambassador.findUnique({ where: { id } });
        if (!ambassador) throw new NotFoundException('Ambassador not found');

        const updated = await this.prisma.ambassador.update({
            where: { id },
            data: { balance: { increment: dto.amount } }
        });

        await this.logActivity(id, 'BALANCE_ADDED', `Added ${dto.amount} - Reason: ${dto.reason}`);
        
        return updated;
    }

    async requestWithdrawal(id: string, dto: RequestWithdrawalDto) {
        const ambassador = await this.prisma.ambassador.findUnique({ where: { id } });
        if (!ambassador) throw new NotFoundException('Ambassador not found');

        if (ambassador.balance < dto.amount) {
            throw new BadRequestException('Insufficient balance');
        }

        // Create request
        const request = await this.prisma.withdrawalRequest.create({
            data: {
                ambassadorId: id,
                amount: dto.amount,
                method: dto.method,
                status: 'PENDING'
            }
        });

        // Deduct balance immediately or hold it? Usually hold or verify. 
        // Let's deduct on approval or mark as 'frozen'. 
        // Simple approach: Check balance here, deduct on approval.
        
        await this.logActivity(id, 'WITHDRAWAL_REQUEST', `Requested ${dto.amount} via ${dto.method}`);
        return request;
    }

    async approveWithdrawal(id: string, requestId: string, dto: ApproveWithdrawalDto, adminId: string) {
        const request = await this.prisma.withdrawalRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

        const ambassador = await this.prisma.ambassador.findUnique({ where: { id } });
        if (!ambassador) throw new NotFoundException('Ambassador not found');
        if (ambassador.balance < request.amount) throw new BadRequestException('Insufficient balance');

        // Deduct balance
        await this.prisma.ambassador.update({
            where: { id },
            data: { balance: { decrement: request.amount } }
        });

        const updated = await this.prisma.withdrawalRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                processedAt: new Date(),
                adminId
            }
        });

        await this.logActivity(id, 'WITHDRAWAL_APPROVED', `Approved ${request.amount} - TX: ${dto.transactionId}`);
        return updated;
    }

    async rejectWithdrawal(id: string, requestId: string, reason: string, adminId: string) {
        const request = await this.prisma.withdrawalRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Request not found');

        const updated = await this.prisma.withdrawalRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                processedAt: new Date(),
                adminId
            }
        });

        await this.logActivity(id, 'WITHDRAWAL_REJECTED', `Rejected ${request.amount} - Reason: ${reason}`);
        return updated;
    }

    async getWithdrawals(id: string) {
        return this.prisma.withdrawalRequest.findMany({
            where: { ambassadorId: id },
            orderBy: { requestedAt: 'desc' }
        });
    }

    // --------------------------------------------------------------------------------
    // ACTIVITY LOGS
    // --------------------------------------------------------------------------------

    private async logActivity(ambassadorId: string, action: string, details?: string) {
        await this.prisma.ambassadorActivityLog.create({
            data: {
                ambassadorId,
                action,
                details
            }
        });
    }

    async getLogs(id: string) {
        return this.prisma.ambassadorActivityLog.findMany({
            where: { ambassadorId: id },
            orderBy: { createdAt: 'desc' }
        });
    }

    // --------------------------------------------------------------------------------
    // ANALYTICS & MONITORING
    // --------------------------------------------------------------------------------

    async getAnalytics() {
        const total = await this.prisma.ambassador.count();
        const active = await this.prisma.ambassador.count({ where: { status: 'ACTIVE' } });
        const pending = await this.prisma.ambassador.count({ where: { status: 'PENDING' } });
        
        const earnings = await this.prisma.ambassador.aggregate({
            _sum: { balance: true } // This is current balance, ideally track lifetime earnings separately or sum withdrawals + balance
        });
        
        // Simple fraud detection logic
        const suspicious = await this.prisma.ambassador.findMany({
            where: {
                balance: { gt: 1000 }, // Threshold
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // New account high balance
            }
        });

        return {
            overview: { total, active, pending, totalBalance: earnings._sum.balance || 0 },
            suspiciousActivity: suspicious.map(s => ({ id: s.id, name: s.name, reason: 'High earnings on new account' }))
        };
    }

    async trackReferral(referralCode: string, newUserId: string) {
        const ambassador = await this.prisma.ambassador.findUnique({ where: { referralCode } });
        if (!ambassador) return null; 

        // Add 5% commission logic or fixed bonus
        // For now, keep existing wallet reward logic but also update Ambassador balance?
        // Prompt says "Every ambassador must have a wallet... currentBalance".
        // Let's update the Ambassador balance directly for tracking.
        
        await this.prisma.ambassador.update({
            where: { id: ambassador.id },
            data: { balance: { increment: 10 } } // $10 per referral example
        });

        // Also reward User wallet points if linked
        if (ambassador.userId) {
             await this.walletService.rewardUser('system', ambassador.userId, 50, `Referral Bonus: User ${newUserId}`);
        }
        
        await this.logActivity(ambassador.id, 'REFERRAL', `Referral: User ${newUserId}`);

        return { success: true, ambassadorId: ambassador.id };
    }
}
