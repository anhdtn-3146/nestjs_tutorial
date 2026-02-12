import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
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
      field: 'Password',
    }),
  })
  @MinLength(6, {
    message: i18nValidationMessage('validation.minLength', {
      field: 'Password',
      min: 6,
    }),
  })
  password: string;
}
