import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !(await bcrypt.compare(payload.password, user.password))) {
      throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials'));
    }

    const jwtPayload = { email: user.email, sub: user.id };

    return {
      access_token: await this.jwtService.signAsync(jwtPayload),
    };
  }

  async register(payload: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(payload.email);

    if (existingUser) {
      throw new UnauthorizedException(this.i18n.t('auth.existEmail'));
    }

    const hashPassword = await bcrypt.hash(payload.password, 10);

    try {
      await this.usersService.create({
        ...payload,
        password: hashPassword,
      });
    } catch {
      throw new UnauthorizedException(this.i18n.t('auth.registrationFailed'));
    }
  }
}
