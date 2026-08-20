import { IsIn } from 'class-validator';
import { BookingStatus } from 'src/database/entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsIn([BookingStatus.APPROVED, BookingStatus.REJECTED])
  declare status: BookingStatus.APPROVED | BookingStatus.REJECTED;
}
