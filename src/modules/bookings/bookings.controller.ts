import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/database/entities/user.entity';
import { AccessTokenPayload } from 'src/modules/auth/auth.types';
import { BookingsService } from './bookings.service';
import { AdminListBookingDto } from './dto/admin-list-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingDto } from './dto/list-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller()
@UseGuards(RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListBookingDto,
  ) {
    return this.bookingsService.findAll(request.user.sub, query);
  }

  @Post('bookings')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(request.user.sub, dto);
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
