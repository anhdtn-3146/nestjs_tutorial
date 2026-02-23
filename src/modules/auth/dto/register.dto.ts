import { IsNotEmpty, MaxLength } from 'class-validator';
import { LoginDto } from './login.dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto extends LoginDto {
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
}
