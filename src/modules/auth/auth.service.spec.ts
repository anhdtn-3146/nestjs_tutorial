import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { UserEntity, UserRole } from '../../database/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { AuthSessionsService } from './auth-sessions.service';
import { AuthService } from './auth.service';
import { AccessTokenPayload } from './auth.types';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;

  const user = {
    id: 1,
    email: 'test@example.com',
    password: 'password-hash',
    fullName: 'Test User',
    phone: null,
    role: UserRole.USER,
  } as UserEntity;

  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn() };
  const i18nService = { t: jest.fn((key: string) => key) };
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        JWT_ACCESS_EXPIRES_IN_SECONDS: 900,
        REFRESH_TOKEN_EXPIRES_IN_DAYS: 7,
      };
      return values[key] ?? defaultValue;
    }),
  };
  const authSessionsService = {
    create: jest.fn(),
    findActiveByRefreshTokenHash: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revoke: jest.fn(),
  };
  const redisService = { blacklistAccessToken: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: I18nService, useValue: i18nService },
        { provide: ConfigService, useValue: configService },
        { provide: AuthSessionsService, useValue: authSessionsService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('returns an access and refresh token and stores only the refresh hash', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    bcryptMock.compare.mockResolvedValue(true as never);
    authSessionsService.create.mockResolvedValue({ id: 12 });
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await service.login({
      email: user.email,
      password: 'password123',
    });

    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 900,
    });
    expect(result.refresh_token).toHaveLength(128);
    expect(authSessionsService.create).toHaveBeenCalledWith({
      userId: user.id,
      refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      expiresAt: expect.any(Date),
    });
    expect(
      authSessionsService.create.mock.calls[0][0].refreshTokenHash,
    ).not.toBe(result.refresh_token);
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: 12,
      jti: expect.any(String),
      type: 'access',
    });
  });

  it('rejects invalid login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: user.email, password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(authSessionsService.create).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token', async () => {
    authSessionsService.findActiveByRefreshTokenHash.mockResolvedValue({
      id: 12,
      user,
    });
    authSessionsService.rotateRefreshToken.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('new-access-token');

    const result = await service.refreshToken({
      refreshToken: 'old-refresh-token',
    });

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).not.toBe('old-refresh-token');
    expect(authSessionsService.rotateRefreshToken).toHaveBeenCalledWith(
      12,
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.any(Date),
    );
  });

  it('rejects an invalid or expired refresh token', async () => {
    authSessionsService.findActiveByRefreshTokenHash.mockResolvedValue(null);

    await expect(
      service.refreshToken({ refreshToken: 'invalid-token' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(authSessionsService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('rejects a refresh token that loses the rotation race', async () => {
    authSessionsService.findActiveByRefreshTokenHash.mockResolvedValue({
      id: 12,
      user,
    });
    authSessionsService.rotateRefreshToken.mockResolvedValue(false);

    await expect(
      service.refreshToken({ refreshToken: 'old-refresh-token' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('revokes the session and blacklists the access token on logout', async () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      sid: 12,
      jti: 'access-jti',
      exp: now + 600,
    } as AccessTokenPayload;

    await expect(service.logout(payload)).resolves.toEqual({ success: true });
    expect(redisService.blacklistAccessToken).toHaveBeenCalledWith(
      'access-jti',
      expect.any(Number),
    );
    expect(authSessionsService.revoke).toHaveBeenCalledWith(12, user.id);
  });

  it('registers a user with a hashed password', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    bcryptMock.hash.mockResolvedValue('new-password-hash' as never);
    usersService.create.mockResolvedValue(user);

    await expect(
      service.register({
        email: user.email,
        password: 'password123',
        fullName: user.fullName,
      }),
    ).resolves.toEqual({ success: true });
    expect(usersService.create).toHaveBeenCalledWith({
      email: user.email,
      password: 'new-password-hash',
      fullName: user.fullName,
      phone: null,
    });
  });
});
