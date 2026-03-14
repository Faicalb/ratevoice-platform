import { Body, Controller, Get, Post, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Get('user/my-bookings')
  async getUserBookings(@Request() req) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  @Get('business/:id')
  async getBusinessBookings(@Param('id') businessId: string) {
    return this.bookingsService.getBusinessBookings(businessId);
  }

  @Get('business/my')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async getMyBusinessBookings(@Request() req) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true }
    });
    if (!business) return [];
    return this.bookingsService.getBusinessBookings(business.id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  @Patch(':id')
  async updateStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.updateStatus(id, req.user.id, dto);
  }
}
