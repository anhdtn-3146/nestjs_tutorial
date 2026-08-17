import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: ReturnType<typeof createClient>;

  constructor(configService: ConfigService) {
    this.client = createClient({
      socket: {
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
      },
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;

    await this.client.set(this.blacklistKey(jti), '1', {
      expiration: { type: 'EX', value: ttlSeconds },
    });
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    return (await this.client.exists(this.blacklistKey(jti))) === 1;
  }

  private blacklistKey(jti: string): string {
    return `auth:blacklist:access:${jti}`;
  }
}
