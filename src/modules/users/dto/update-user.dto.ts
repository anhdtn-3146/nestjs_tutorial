import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Email',
    }),
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('validation.emailInvalid'),
    },
  )
  email: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Username',
    }),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Username',
      max: 255,
    }),
  })
  username: string;

  @IsOptional()
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Bio',
      max: 255,
    }),
  })
  bio?: string;

  @IsOptional()
  @IsUrl()
  image?: string;
}
