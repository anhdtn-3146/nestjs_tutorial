import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';

describe('ToursController', () => {
  let controller: ToursController;
  const toursService = {
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

  it('delegates list, detail, create, update and delete to the service', async () => {
    const createDto = {
      category_id: 1,
      title: 'Hue city tour',
      description: 'One day',
    };
    toursService.findAll.mockResolvedValue([]);
    toursService.findOne.mockResolvedValue({ id: 1, ...createDto });
    toursService.create.mockResolvedValue({ id: 1, ...createDto });
    toursService.update.mockResolvedValue({ id: 1, title: 'Updated' });
    toursService.delete.mockResolvedValue({ success: true });

    await controller.findAll({ limit: 10, offset: 0 });
    await controller.findOne(1);
    await controller.create(createDto);
    await controller.update(1, { title: 'Updated' });
    await controller.delete(1);

    expect(toursService.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
    expect(toursService.findOne).toHaveBeenCalledWith(1);
    expect(toursService.create).toHaveBeenCalledWith(createDto);
    expect(toursService.update).toHaveBeenCalledWith(1, { title: 'Updated' });
    expect(toursService.delete).toHaveBeenCalledWith(1);
  });
});
