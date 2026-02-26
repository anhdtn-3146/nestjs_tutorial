import { IsArray, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateArticleDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Title',
    }),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Title',
      max: 255,
    }),
  })
  title: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Description',
    }),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Description',
      max: 255,
    }),
  })
  description: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Body',
    }),
  })
  @MaxLength(5000, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Body',
      max: 5000,
    }),
  })
  body: string;

  @IsOptional()
  @IsArray()
  tagList?: string[];
}
