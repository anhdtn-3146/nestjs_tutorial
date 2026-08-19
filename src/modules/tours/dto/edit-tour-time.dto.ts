import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { TourTimeStatus } from 'src/database/entities/tour-time.entity';
import { CreateTourTimeDto } from './create-tour-time.dto';

export class EditTourTimeDto extends CreateTourTimeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare id?: number;

  @IsEnum(TourTimeStatus)
  declare status: TourTimeStatus;
}
