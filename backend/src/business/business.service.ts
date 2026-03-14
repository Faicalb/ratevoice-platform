import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BusinessService {
    constructor(
        private prisma: PrismaService,
        private storage: StorageService
    ) { }

    async getDashboardStats(userId: string) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
            include: { branches: { select: { id: true } } }
        });

        if (!business) {
            return {
                totalReviews: 0,
                totalBookings: 0,
                activeAds: 0,
                recentReviews: []
            };
        }

        const branchIds = business.branches.map((b) => b.id);
        const [totalReviews, totalBookings, activeAds, recentReviews] = await Promise.all([
            this.prisma.textReview.count({ where: { branchId: { in: branchIds } } }),
            this.prisma.booking.count({ where: { branchId: { in: branchIds } } }),
            this.prisma.adCampaign.count({ where: { businessId: business.id, status: 'ACTIVE' } }),
            this.prisma.textReview.findMany({
                where: { branchId: { in: branchIds } },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { fullName: true, email: true, avatarUrl: true }
                    }
                }
            })
        ]);

        return {
            totalReviews,
            totalBookings,
            activeAds,
            recentReviews
        };
    }

    async getBusinessProfile(userId: string) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
            include: {
                branches: true
            }
        });

        if (!business) {
            return null; // Or create a default one
        }

        return business;
    }

    async registerBusiness(input: any, file?: any) {
        const email = String(input.email || '').trim().toLowerCase();
        const businessName = String(input.business_name || '').trim();
        const businessType = String(input.business_type || '').trim();
        const managerName = String(input.manager_name || '').trim();
        const phone = String(input.phone || '').trim();
        const country = String(input.country || '').trim();
        const city = String(input.city || '').trim();
        const address = String(input.address || '').trim();

        if (!email || !businessName || !businessType || !managerName || !country || !city || !address) {
            throw new BadRequestException('Missing required fields');
        }

        const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';

        return this.prisma.$transaction(async (tx) => {
            let user = await tx.user.findUnique({ where: { email } });
            let tempPassword: string | null = null;

            if (!user) {
                tempPassword = Math.random().toString(36).slice(-10);
                const passwordHash = await bcrypt.hash(tempPassword, 10);
                user = await tx.user.create({
                    data: {
                        email,
                        passwordHash,
                        fullName: managerName,
                        phoneNumber: phone || null,
                        isVerified: false,
                        isActive: true,
                        mustChangePassword: true
                    }
                });
            }

            let role = await tx.role.findUnique({ where: { name: 'BUSINESS' } });
            if (!role) {
                role = await tx.role.create({ data: { name: 'BUSINESS', description: 'Business account' } });
            }
            const existingRole = await tx.userRole.findFirst({ where: { userId: user.id, roleId: role.id, branchId: null } });
            if (!existingRole) {
                await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
            }

            const business = await tx.business.create({
                data: {
                    ownerId: user.id,
                    name: businessName,
                    category: businessType,
                    status: 'PENDING'
                }
            });

            const branch = await tx.businessBranch.create({
                data: {
                    businessId: business.id,
                    name: businessName,
                    address,
                    city,
                    country,
                    phoneNumber: phone || null,
                    isActive: true
                }
            });

            let documentUrl = 'MISSING_DOCUMENT';
            if (file) {
                const url = await this.storage.uploadFile(file, `businesses/${business.id}/verification`);
                if (!url) {
                    if (env === 'production') throw new BadRequestException('Storage is not configured');
                } else {
                    documentUrl = url;
                }
            }

            const verification = await tx.businessVerification.create({
                data: {
                    businessId: business.id,
                    documentUrl,
                    status: 'PENDING'
                }
            });

            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'BUSINESS_REGISTER',
                    resource: 'BUSINESS',
                    details: { businessId: business.id, branchId: branch.id, verificationId: verification.id }
                }
            });

            return {
                success: true,
                status: 'pending',
                businessId: business.id,
                ownerId: user.id,
                ownerTempPassword: tempPassword
            };
        });
    }

    async getVerificationStatus(userId: string) {
        const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
        if (!business) return { status: 'none' };
        const latest = await this.prisma.businessVerification.findFirst({
            where: { businessId: business.id },
            orderBy: { createdAt: 'desc' }
        });
        if (!latest) return { status: 'none' };
        const status = latest.status === 'APPROVED' ? 'verified' : latest.status === 'REJECTED' ? 'rejected' : 'pending';
        return { status, details: latest.rejectionReason || null };
    }

    async getBusinessById(id: string) {
        return this.prisma.business.findUnique({
            where: { id },
            include: { branches: true }
        });
    }

    async updateBusinessProfile(userId: string, data: any) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId }
        });

        if (!business) {
            // Create new if not exists
            return this.prisma.business.create({
                data: {
                    ownerId: userId,
                    name: data.name,
                    description: data.description,
                    website: data.website,
                    category: data.category,
                    status: 'ACTIVE'
                }
            });
        }

        return this.prisma.business.update({
            where: { id: business.id },
            data: {
                name: data.name,
                description: data.description,
                website: data.website,
                category: data.category
            }
        });
    }
}
