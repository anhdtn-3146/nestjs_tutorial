import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/database/entities/user.entity';
import type { AccessTokenPayload } from 'src/modules/auth/auth.types';
import { BookingsService } from './bookings.service';
import { AdminListBookingDto } from './dto/admin-list-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingDto } from './dto/list-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller()
@UseGuards(RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListBookingDto,
  ) {
    return this.bookingsService.findAll(user.sub, query);
  }

  @Post('bookings')
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user.sub, dto);
  }

  @Put('bookings/:id/cancel')
  cancel(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.cancel(user.sub, id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/bookings')
  findAllForAdmin(@Query() query: AdminListBookingDto) {
    return this.bookingsService.findAllForAdmin(query);
  }

  @Roles(UserRole.ADMIN)
  @Put('admin/bookings/:id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }
}
