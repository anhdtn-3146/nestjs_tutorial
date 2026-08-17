import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSessionEntity } from 'src/database/entities/auth-session.entity';
import { IsNull, MoreThan, Repository } from 'typeorm';

@Injectable()
export class AuthSessionsService {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly sessionRepository: Repository<AuthSessionEntity>,
  ) {}

  create(
    data: Pick<AuthSessionEntity, 'userId' | 'refreshTokenHash' | 'expiresAt'>,
  ) {
    return this.sessionRepository.save(this.sessionRepository.create(data));
  }

  findActiveByRefreshTokenHash(refreshTokenHash: string) {
    return this.sessionRepository.findOne({
      where: {
        refreshTokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
    });
  }

  async rotateRefreshToken(
    sessionId: number,
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const result = await this.sessionRepository.update(
      {
        id: sessionId,
        refreshTokenHash: oldHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      { refreshTokenHash: newHash, expiresAt },
    );

    return result.affected === 1;
  }

  async revoke(sessionId: number, userId: number): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId, userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
