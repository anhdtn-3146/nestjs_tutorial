import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateTourDto {
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage('validation.integer', {
      field: 'Category ID',
    }),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.minValue', {
      field: 'Category ID',
      min: 1,
    }),
  })
  declare category_id: number;

  @IsString({
    message: i18nValidationMessage('validation.string', { field: 'Title' }),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', { field: 'Title' }),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Title',
      max: 255,
    }),
  })
  declare title: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({
    message: i18nValidationMessage('validation.string', {
      field: 'Description',
    }),
  })
  declare description?: string | null;
}
