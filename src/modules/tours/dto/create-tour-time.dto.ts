import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, Matches, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateTourTimeDto {
  @IsDateString(
    {},
    {
      message: i18nValidationMessage('validation.date', {
        field: 'Start date',
      }),
    },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: i18nValidationMessage('validation.date', {
      field: 'Start date',
    }),
  })
  declare start_date: string;

  @IsDateString(
    {},
    {
      message: i18nValidationMessage('validation.date', {
        field: 'End date',
      }),
    },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: i18nValidationMessage('validation.date', {
      field: 'End date',
    }),
  })
  declare end_date: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: i18nValidationMessage('validation.number', { field: 'Price' }),
    },
  )
  @Min(0, {
    message: i18nValidationMessage('validation.minValue', {
      field: 'Price',
      min: 0,
    }),
  })
  declare price: number;

  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage('validation.integer', {
      field: 'Maximum capacity',
    }),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.minValue', {
      field: 'Maximum capacity',
      min: 1,
    }),
  })
  declare max_capacity: number;
}
