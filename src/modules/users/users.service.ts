import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { UserEntity } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { UserSerializer } from './serializers/user.serializer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly i18n: I18nService,
  ) {}

  async findById(id: number, type?: UserSerializerType) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('notFound', { args: { field: 'User' } }),
      );
    }

    return new UserSerializer(user, { type: 'BASIC_INFO' }).serialize();
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  create(data: Partial<UserEntity>) {
    return this.userRepository.save(data);
  }
}
