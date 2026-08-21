import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
      const currentUser = { sub: mockUser.id } as never;
      mockUsersService.findById.mockResolvedValue(mockUser);
      const result = await controller.getCurrentUser(currentUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should propagate NotFoundException if user is not found', async () => {
      const currentUser = { sub: 999 } as never;
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getCurrentUser(currentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findById).toHaveBeenCalledWith(999);
    });
  });
});
