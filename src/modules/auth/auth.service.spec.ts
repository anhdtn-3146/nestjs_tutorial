import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from '../../database/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn(),
  };

  const mockUser: UserEntity = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    username: 'testuser',
    bio: '',
    image: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token when login successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedToken = 'jwt.token.here';
      const expectedPayload = { email: mockUser.email, sub: mockUser.id };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual({ access_token: expectedToken });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockI18nService.t).toHaveBeenCalledWith(
        'common.auth.invalidCredentials',
      );
      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockI18nService.t).toHaveBeenCalledWith(
        'common.auth.invalidCredentials',
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when bcrypt comparison fails', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockImplementation(() => {
        throw new Error('Bcrypt error');
      });
      mockI18nService.t.mockReturnValue('Invalid credentials');

      await expect(service.login(loginDto)).rejects.toThrow();

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should handle JWT signing failure', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync.mockRejectedValue(
        new Error('JWT signing failed'),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        'JWT signing failed',
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
      };

      const hashedPassword = '$2b$10$newHashedPassword';

      mockUsersService.findByEmail.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockResolvedValue({
        ...registerDto,
        password: hashedPassword,
        id: 2,
      } as UserEntity);

      const result = await service.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcryptMock.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw UnauthorizedException when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existinguser',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockI18nService.t.mockReturnValue('Email already exists');

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockI18nService.t).toHaveBeenCalledWith('common.auth.existEmail');
      expect(bcryptMock.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should handle password hashing failure', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      bcryptMock.hash.mockImplementation(() => {
        throw new Error('Hashing failed');
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'Hashing failed',
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcryptMock.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should handle user creation failure', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
      };

      const hashedPassword = '$2b$10$newHashedPassword';

      mockUsersService.findByEmail.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcryptMock.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
    });

    it('should hash password with correct salt rounds', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'plainPassword',
        username: 'testuser',
      };

      const hashedPassword = '$2b$10$hashedPassword';

      mockUsersService.findByEmail.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockResolvedValue({} as UserEntity);

      await service.register(registerDto);

      expect(bcryptMock.hash).toHaveBeenCalledWith('plainPassword', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
    });

    it('should register user with all provided fields', async () => {
      const registerDto: RegisterDto = {
        email: 'complete@example.com',
        password: 'password123',
        username: 'completeuser',
      };

      const hashedPassword = '$2b$10$hashedPassword';

      mockUsersService.findByEmail.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockResolvedValue({} as UserEntity);

      await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: hashedPassword,
        username: registerDto.username,
      });
    });
  });
});
