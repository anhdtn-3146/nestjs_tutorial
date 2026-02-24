import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: any;

  beforeEach(async () => {
    mockUsersService = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return the user from the request', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };
      const mockReq = { user: { sub: mockUser.id } };
      mockUsersService.findById.mockResolvedValue(mockUser);
      const result = await controller.getCurrentUser(mockReq);
      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const mockReq = { user: { sub: 999 } };
      mockUsersService.findById.mockResolvedValue(undefined);
      await expect(controller.getCurrentUser(mockReq)).rejects.toThrow(
        'Unauthorized',
      );
      expect(mockUsersService.findById).toHaveBeenCalledWith(999);
    });
  });
});
