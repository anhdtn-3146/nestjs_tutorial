import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuthSessionsService } from './auth-sessions.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { AccessTokenPayload } from './auth.types';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly redisService: RedisService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !(await bcrypt.compare(payload.password, user.password))) {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidCredentials'),
      );
    }

    const refreshToken = this.generateRefreshToken();
    const session = await this.authSessionsService.create({
      userId: user.id,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: this.getRefreshTokenExpiresAt(),
    });

    return {
      access_token: await this.generateAccessToken(user, session.id),
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.getAccessTokenExpiresInSeconds(),
    };
  }

  async refreshToken(payload: RefreshTokenDto) {
    const oldHash = this.hashRefreshToken(payload.refreshToken);
    const session =
      await this.authSessionsService.findActiveByRefreshTokenHash(oldHash);

    if (!session) {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidRefreshToken'),
      );
    }

    const newRefreshToken = this.generateRefreshToken();
    const accessToken = await this.generateAccessToken(
      session.user,
      session.id,
    );
    const rotated = await this.authSessionsService.rotateRefreshToken(
      session.id,
      oldHash,
      this.hashRefreshToken(newRefreshToken),
      this.getRefreshTokenExpiresAt(),
    );

    if (!rotated) {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidRefreshToken'),
      );
    }

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: this.getAccessTokenExpiresInSeconds(),
    };
  }

  async logout(payload: AccessTokenPayload) {
    const ttlSeconds = payload.exp - Math.floor(Date.now() / 1000);

    await this.redisService.blacklistAccessToken(payload.jti, ttlSeconds);
    await this.authSessionsService.revoke(payload.sid, payload.sub);

    return { success: true };
  }

  async register(payload: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(payload.email);

    if (existingUser) {
      throw new UnauthorizedException(this.i18n.t('common.auth.existEmail'));
    }

    const hashPassword = await bcrypt.hash(payload.password, 10);

    try {
      await this.usersService.create({
        password: hashPassword,
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone ?? null,
      });

      return { success: true };
    } catch {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.registrationFailed'),
      );
    }
  }

  private generateAccessToken(user: UserEntity, sessionId: number) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId,
      jti: randomUUID(),
      type: 'access',
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAccessTokenExpiresInSeconds(): number {
    return Number(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS') ?? 900,
    );
  }

  private getRefreshTokenExpiresAt(): Date {
    const expiresInDays = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
      7,
    );

    return new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  }
}
