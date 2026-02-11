import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !(await bcrypt.compare(payload.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const jwtPayload = { email: user.email, sub: user.id };

    return {
      access_token: await this.jwtService.signAsync(jwtPayload),
    };
  }

  async register(payload: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(payload.email);

    if (existingUser) {
      throw new UnauthorizedException(
        'Email đã tồn tại, vui lòng sử dụng email khác',
      );
    }

    const hashPassword = await bcrypt.hash(payload.password, 10);

    await this.usersService.create({
      ...payload,
      password: hashPassword,
    });

    return { success: true };
  }
}
