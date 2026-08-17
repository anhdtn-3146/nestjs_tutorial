import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSessionEntity } from 'src/database/entities/auth-session.entity';
import { AuthSessionsService } from './auth-sessions.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([AuthSessionEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessTokenExpiresInSeconds = Number(
          configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS') ?? 900,
        );

        return {
          global: true,
          secret:
            configService.get<string>('JWT_ACCESS_SECRET') ??
            configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: accessTokenExpiresInSeconds,
          },
        };
      },
    }),
  ],
  providers: [
    AuthService,
    AuthSessionsService,
    AuthGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
