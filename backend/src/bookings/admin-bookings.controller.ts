import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async getAllBookings() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  async getBookingById(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  async updateBookingStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.bookingsService.updateStatus(id, 'ADMIN', { status });
  }

  @Post(':id/refund')
  async refundBooking(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }
}
