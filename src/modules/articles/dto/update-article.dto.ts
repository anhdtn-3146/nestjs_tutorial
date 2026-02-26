import { IsArray, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateArticleDto {
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

  @IsOptional()
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Description',
      max: 255,
    }),
  })
  description: string;

  @IsOptional()
  @MaxLength(5000, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Body',
      max: 5000,
    }),
  })
  body: string;
}
