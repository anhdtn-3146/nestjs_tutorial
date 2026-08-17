import { IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { LoginDto } from './login.dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto extends LoginDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Full name',
    }),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Full name',
      max: 255,
    }),
  })
  fullName: string;

  @IsOptional()
  @MaxLength(20, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Phone',
      max: 20,
    }),
  })
  phone?: string;
}
