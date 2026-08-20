import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare tour_time_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare number_of_slots: number;
}
