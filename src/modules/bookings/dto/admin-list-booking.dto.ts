import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { ListBookingDto } from './list-booking.dto';

export class AdminListBookingDto extends ListBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
