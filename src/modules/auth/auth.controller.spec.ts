import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = { access_token: 'mock-jwt-token' };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockI18nService.t.mockReturnValue('Invalid credentials');
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should return success when registration is valid', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };
      const mockResponse = { success: true };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
      };

      mockI18nService.t.mockReturnValue('Email already exists');
      mockAuthService.register.mockRejectedValue(
        new UnauthorizedException('Email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    it('should return a rotated token pair', async () => {
      const dto = { refreshToken: 'old-refresh-token' };
      const response = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };
      mockAuthService.refreshToken.mockResolvedValue(response);

      await expect(controller.refreshToken(dto)).resolves.toEqual(response);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('should logout the current session', async () => {
      const user = { sub: 1, sid: 2, jti: 'jti' } as never;
      mockAuthService.logout.mockResolvedValue({ success: true });

      await expect(controller.logout(user)).resolves.toEqual({
        success: true,
      });
      expect(mockAuthService.logout).toHaveBeenCalledWith(user);
    });
  });
});
