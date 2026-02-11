import { IsNotEmpty, MaxLength } from 'class-validator';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MaxLength(255, { message: 'Username tối đa 255 ký tự' })
  username: string;
}
