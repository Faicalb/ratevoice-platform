import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AiBusinessService } from './ai-business.service';
import { WalletTransactionService } from '../wallet/wallet-transaction.service';

@Injectable()
export class AdminBusinessService {
  constructor(
    private prisma: PrismaService,
    private aiBusinessService: AiBusinessService,
    private walletTransactions: WalletTransactionService
  ) {}

  async searchPlaces(query: string) {
    return this.aiBusinessService.searchPlaces(query);
  }

  async detectDuplicates(name: string, lat: number, lng: number) {
    return this.aiBusinessService.detectDuplicates(name, lat, lng);
  }

  async createBusinessManual(adminId: string, data: any) {
    const { 
      businessName, 
      businessType, 
      address, 
      city, 
      country, 
      latitude, 
      longitude, 
      googleMapsLink, 
      email, 
      phone, 
      website, 
      description,
      
      ownerName, 
      ownerEmail, 
      ownerPhone, 
      
      verificationStatus, 
      subscriptionPlan, 
      initialWalletBalance, 
      allowPointsPayment, 
      enableReservations 
    } = data;

    // 1. Validation
    if (!ownerEmail || !businessName) {
      throw new BadRequestException('Owner Email and Business Name are required.');
    }

    // 2. Transactional Creation
    return this.prisma.$transaction(async (tx) => {
      // A. Create or Find Owner User
      let user = await tx.user.findUnique({ where: { email: ownerEmail } });
      let issuedTempPassword: string | null = null;
      
      if (!user) {
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        issuedTempPassword = tempPassword;
        
        user = await tx.user.create({
          data: {
            email: ownerEmail,
            passwordHash: hashedPassword,
            fullName: ownerName,
            phoneNumber: ownerPhone,
            isActive: true,
            isVerified: true, // Auto-verify admin created users? Usually yes.
            mustChangePassword: true,
            wallet: {
                create: {
                    balance: 0,
                    currency: 'USD'
                }
            }
          }
        });

        // Assign BUSINESS Role
        const businessRole = await tx.role.findUnique({ where: { name: 'BUSINESS' } });
        if (businessRole) {
            await tx.userRole.create({
                data: {
                    userId: user.id,
                    roleId: businessRole.id
                }
            });
        }
        
      }

      // B. Create Business
      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          name: businessName,
          description: description,
          category: businessType,
          website: website,
          status: 'ACTIVE', // Default active since admin created it
          // verificationStatus is not directly on Business model in schema, 
          // usually managed via BusinessVerification table or implied.
          // We'll create a verification record if verified.
        }
      });

      // C. Create Main Branch
      const branch = await tx.businessBranch.create({
        data: {
          businessId: business.id,
          name: `${businessName} HQ`,
          address: address,
          city: city,
          country: country,
          latitude: Number(latitude),
          longitude: Number(longitude),
          phoneNumber: phone,
          isActive: true
        }
      });

      // D. Handle Wallet Balance (If needed, update User's wallet)
      if (initialWalletBalance && Number(initialWalletBalance) > 0) {
        await this.walletTransactions.creditWalletWithCompletedTransaction(
          {
            userId: user.id,
            amount: Number(initialWalletBalance),
            currency: 'USD',
            type: 'ADMIN_ADJUSTMENT',
            provider: 'ADMIN',
            referenceId: `INIT_ADMIN_${business.id}`,
            adminId,
            adminActionType: 'manual_adjustment',
            adminReason: 'Initial wallet balance'
          },
          tx
        );
      }

      if (verificationStatus === 'Verified') {
        await tx.businessVerification.create({
            data: {
                businessId: business.id,
                documentUrl: 'ADMIN_MANUAL_VERIFICATION',
                status: 'APPROVED',
                verifiedAt: new Date()
            }
        });
      }

      return {
        businessId: business.id,
        ownerId: user.id,
        branchId: branch.id,
        message: 'Business created successfully',
        ownerTempPassword: issuedTempPassword
      };
    });
  }
}
