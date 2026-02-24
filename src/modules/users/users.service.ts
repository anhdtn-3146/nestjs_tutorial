import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { UserEntity } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import {
  UserSerializer,
  UserSerializerType,
} from './serializers/user.serializer';

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

    return new UserSerializer(user, { type: type || 'BASIC_INFO' }).serialize();
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  create(data: Partial<UserEntity>) {
    return this.userRepository.save(data);
  }

  async update(id: number, data: Partial<UserEntity>) {
    const existUser = await this.findById(id);

    if (!existUser) {
      throw new NotFoundException(
        this.i18n.t('notFound', { args: { field: 'User' } }),
      );
    }

    if (data.email && data.email !== existUser.email) {
      const emailExist = await this.findByEmail(data.email);
      if (emailExist) {
        throw new ConflictException(this.i18n.t('common.auth.existEmail'));
      }
    }

    try {
      await this.userRepository.save({ ...existUser, ...data });

      return { success: true };
    } catch (error) {
      throw new BadRequestException(this.i18n.t('invalid'));
    }
  }
}
