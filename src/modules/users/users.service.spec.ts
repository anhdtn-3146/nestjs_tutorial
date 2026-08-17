import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { UserEntity } from 'src/database/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should call userRepository.findOne with id', async () => {
      const user = { id: 1, email: 'test@example.com' } as UserEntity;
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.findById(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });
  });

  describe('findByEmail', () => {
    it('should call userRepository.findOne with email', async () => {
      const user = { id: 2, email: 'foo@bar.com' } as UserEntity;
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.findByEmail('foo@bar.com');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'foo@bar.com' },
      });
      expect(result).toBe(user);
    });
  });

  describe('create', () => {
    it('should call userRepository.save with data', async () => {
      const data = {
        email: 'new@user.com',
        password: 'pass',
        fullName: 'New User',
      };
      const user = { id: 3, ...data } as UserEntity;
      userRepository.save.mockResolvedValue(user);
      const result = await service.create(data);
      expect(userRepository.save).toHaveBeenCalledWith(data);
      expect(result).toBe(user);
    });
  });
});
