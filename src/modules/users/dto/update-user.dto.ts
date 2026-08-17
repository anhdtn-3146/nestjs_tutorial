import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserRole } from 'src/database/entities/user.entity';

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

  @ValidateIf((_, value) => value !== undefined)
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
  fullName?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.required', {
      field: 'Phone',
    }),
  })
  @IsString()
  @MaxLength(20, {
    message: i18nValidationMessage('validation.maxLength', {
      field: 'Phone',
      max: 20,
    }),
  })
  phone?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;
}
