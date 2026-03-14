import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';
import { WalletService } from '../wallet/wallet.service';
import { PaginationDto, getPagination } from '../common/dto/pagination.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService
  ) {}

  async findAll(pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});
    return this.prisma.booking.findMany({
      skip,
      take,
      include: {
        user: { select: { fullName: true, email: true } },
        branch: { include: { business: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        branch: { include: { business: true } }
      }
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getUserBookings(userId: string, pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});
    return this.prisma.booking.findMany({
      where: { userId },
      skip,
      take,
      include: {
        branch: { include: { business: { select: { name: true, category: true } } } }
      },
      orderBy: { bookingDate: 'desc' }
    });
  }

  async getBusinessBookings(businessId: string, pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});
    return this.prisma.booking.findMany({
      where: { branch: { businessId } },
      skip,
      take,
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true, phoneNumber: true } }
      },
      orderBy: { bookingDate: 'asc' }
    });
  }

  async create(userId: string, dto: CreateBookingDto) {
    const { businessId, branchId, date, guests, price, roomType } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Create Booking
      const booking = await prisma.booking.create({
        data: {
          userId,
          branchId: branchId || businessId,
          bookingDate: new Date(date),
          totalAmount: price,
          status: 'CONFIRMED',
        }
      });

      // 2. Charge Wallet (Atomic Check inside WalletService)
      // We cast prisma to any because of type mismatch with WalletService signature
      await this.walletService.charge(userId, price, `bk-${booking.id}`, prisma);

      return booking;
    });
  }

  async updateStatus(bookingId: string, userId: string, dto: UpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Only Owner or Business can update? 
    // For now, assuming business owner or admin calls this via appropriate guard.
    // If it's a cancellation, handle refund.
    
    if (dto.status === 'CANCELLED' && booking.status !== 'CANCELLED') {
        return this.cancelBooking(bookingId);
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status }
    });
  }

  async cancelBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CANCELLED') throw new BadRequestException('Already cancelled');

    return this.prisma.$transaction(async (prisma) => {
      // 1. Update Status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });

      // 2. Refund Wallet
      await this.walletService.refund(booking.userId, Number(booking.totalAmount), `ref-bk-${booking.id}`, prisma);

      return updatedBooking;
    });
  }
}
