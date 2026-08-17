import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn() };
  const configService = { get: jest.fn(() => 'access-secret') };
  const redisService = { isAccessTokenBlacklisted: jest.fn() };
  const guard = new AuthGuard(
    jwtService as unknown as JwtService,
    reflector as unknown as Reflector,
    configService as unknown as ConfigService,
    redisService as unknown as RedisService,
  );

  const createContext = (authorization?: string) => {
    const request = { headers: { authorization } };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('allows public endpoints without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('attaches a valid, non-blacklisted access payload', async () => {
    const payload = {
      sub: 1,
      sid: 2,
      jti: 'token-jti',
      type: 'access',
    };
    jwtService.verifyAsync.mockResolvedValue(payload);
    redisService.isAccessTokenBlacklisted.mockResolvedValue(false);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toHaveProperty('user', payload);
  });

  it('rejects a blacklisted access token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      sid: 2,
      jti: 'token-jti',
      type: 'access',
    });
    redisService.isAccessTokenBlacklisted.mockResolvedValue(true);
    const { context } = createContext('Bearer revoked-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token without required access claims', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1, type: 'refresh' });
    const { context } = createContext('Bearer refresh-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
