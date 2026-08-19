import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { TourTimeStatus } from 'src/database/entities/tour-time.entity';
import { UserRole } from 'src/database/entities/user.entity';
import { IS_PUBLIC_KEY } from 'src/modules/auth/public.decorator';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';

describe('ToursController', () => {
  let controller: ToursController;
  const toursService = {
    findPublic: jest.fn(),
    findPublicOne: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToursController],
      providers: [
        { provide: ToursService, useValue: toursService },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    controller = module.get(ToursController);
    jest.clearAllMocks();
  });

  it('delegates public list and detail with public metadata', async () => {
    const query = { limit: 10, offset: 20 };
    toursService.findPublic.mockResolvedValue({
      tours: [],
      page: { total: 0, ...query },
    });
    toursService.findPublicOne.mockResolvedValue({ id: 2, tourTimes: [] });

    await expect(controller.findPublic(query)).resolves.toEqual({
      tours: [],
      page: { total: 0, ...query },
    });
    await expect(controller.findPublicOne(2)).resolves.toEqual({
      id: 2,
      tourTimes: [],
    });
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.findPublic)).toBe(
      true,
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.findPublicOne)).toBe(
      true,
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ToursController)).toBeUndefined();
    expect(toursService.findPublic).toHaveBeenCalledWith(query);
    expect(toursService.findPublicOne).toHaveBeenCalledWith(2);
  });

  it.each(['findAll', 'findOne', 'create', 'update', 'delete'] as const)(
    'requires the admin role for %s',
    (method) => {
      expect(Reflect.getMetadata(ROLES_KEY, controller[method])).toEqual([
        UserRole.ADMIN,
      ]);
    },
  );

  it('delegates list, detail, create, update and delete to the service', async () => {
    const createDto = {
      category_id: 1,
      title: 'Hue city tour',
      description: 'One day',
      tour_times: [
        {
          start_date: '2030-01-01',
          end_date: '2030-01-02',
          price: 100,
          max_capacity: 10,
        },
      ],
    };
    toursService.findAll.mockResolvedValue([]);
    toursService.findOne.mockResolvedValue({ id: 1, ...createDto });
    toursService.create.mockResolvedValue({ id: 1, ...createDto });
    toursService.update.mockResolvedValue({ id: 1, title: 'Updated' });
    toursService.delete.mockResolvedValue({ success: true });

    await controller.findAll({ limit: 10, offset: 0 });
    await controller.findOne(1);
    await controller.create(createDto);
    const updateDto = {
      category_id: 1,
      title: 'Updated',
      description: 'One day',
      tour_times: [
        {
          id: 2,
          start_date: '2030-01-01',
          end_date: '2030-01-02',
          price: 100,
          max_capacity: 10,
          status: TourTimeStatus.OPEN,
        },
      ],
    };
    await controller.update(1, updateDto);
    await controller.delete(1);

    expect(toursService.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
    expect(toursService.findOne).toHaveBeenCalledWith(1);
    expect(toursService.create).toHaveBeenCalledWith(createDto, []);
    expect(toursService.update).toHaveBeenCalledWith(1, updateDto, []);
    expect(toursService.delete).toHaveBeenCalledWith(1);
  });
});
