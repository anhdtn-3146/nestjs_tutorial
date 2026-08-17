import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/modules/auth/public.decorator';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/modules/redis/redis.service';
import { AccessTokenPayload } from 'src/modules/auth/auth.types';
import { Request } from 'express';

type AuthenticatedRequest = Request & { user?: AccessTokenPayload };

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const jwtToken = token.slice('Bearer '.length).trim();
    if (!jwtToken) throw new UnauthorizedException();

    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(jwtToken, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException();
    }

    if (
      payload.type !== 'access' ||
      !payload.jti ||
      !payload.sid ||
      !payload.sub
    ) {
      throw new UnauthorizedException();
    }

    try {
      const isBlacklisted = await this.redisService.isAccessTokenBlacklisted(
        payload.jti,
      );

      if (isBlacklisted) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.warn(
        `Redis unavailable, skipping blacklist check for jti=${payload.jti}`,
      );
    }

    request.user = payload;

    return true;
  }
}
