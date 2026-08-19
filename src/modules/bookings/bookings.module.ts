import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { TourTimeEntity } from 'src/database/entities/tour-time.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity, TourTimeEntity])],
  controllers: [BookingsController],
  providers: [BookingsService, RolesGuard],
})
export class BookingsModule {}
