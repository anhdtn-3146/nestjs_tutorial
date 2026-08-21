import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ListTourDto } from './list-tour.dto';

export enum TourSortBy {
  PRICE = 'price',
  START_DATE = 'start_date',
  NAME = 'name',
  RATING = 'rating',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchTourDto extends ListTourDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  min_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  max_price?: number;

  @IsOptional()
  @IsEnum(TourSortBy)
  sort_by?: TourSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;
}
