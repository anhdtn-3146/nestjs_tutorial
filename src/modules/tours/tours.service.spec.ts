import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { Repository } from 'typeorm';
import { ToursService } from './tours.service';

describe('ToursService', () => {
  let service: ToursService;
  let tourRepository: jest.Mocked<
    Pick<
      Repository<TourEntity>,
      'createQueryBuilder' | 'findOne' | 'create' | 'save' | 'delete'
    >
  >;
  let categoryRepository: jest.Mocked<
    Pick<Repository<CategoryEntity>, 'findOne'>
  >;
  const query = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    tourRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    query.leftJoinAndSelect.mockReturnValue(query);
    query.orderBy.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.take.mockReturnValue(query);
    tourRepository.createQueryBuilder.mockReturnValue(query as never);
    categoryRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToursService,
        {
          provide: getRepositoryToken(TourEntity),
          useValue: tourRepository,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepository,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(ToursService);
  });

  it('lists tours and returns a tour detail with its category', async () => {
    const tour = { id: 1, title: 'Hue city tour' } as TourEntity;
    query.getManyAndCount.mockResolvedValue([[tour], 1]);
    tourRepository.findOne.mockResolvedValue(tour);

    await expect(service.findAll({ limit: 10, offset: 5 })).resolves.toEqual({
      tours: [tour],
      page: { total: 1, limit: 10, offset: 5 },
    });
    await expect(service.findOne(1)).resolves.toBe(tour);
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.take).toHaveBeenCalledWith(10);
    expect(tourRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: { category: true },
    });
  });

  it('creates a tour after validating its category', async () => {
    const dto = {
      category_id: 2,
      title: 'Da Nang discovery',
      description: 'Three-day tour',
    };
    const tour = { id: 1, categoryId: 2, ...dto } as unknown as TourEntity;
    categoryRepository.findOne.mockResolvedValue({ id: 2 } as CategoryEntity);
    tourRepository.create.mockReturnValue(tour);
    tourRepository.save.mockResolvedValue(tour);

    await expect(service.create(dto)).resolves.toBe(tour);
    expect(categoryRepository.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
    });
    expect(tourRepository.create).toHaveBeenCalledWith({
      categoryId: 2,
      title: dto.title,
      description: dto.description,
    });
  });

  it('rejects creation when the category does not exist', async () => {
    categoryRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        category_id: 999,
        title: 'Unknown category',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(tourRepository.save).not.toHaveBeenCalled();
  });

  it('updates only supplied fields', async () => {
    const tour = {
      id: 1,
      categoryId: 2,
      title: 'Old title',
      description: null,
    } as TourEntity;
    tourRepository.findOne.mockResolvedValue(tour);
    tourRepository.save.mockImplementation(async (value) => value as TourEntity);

    const result = await service.update(1, {
      title: 'New title',
    });

    expect(result.title).toBe('New title');
    expect(result.categoryId).toBe(2);
  });

  it('deletes an existing tour', async () => {
    tourRepository.findOne.mockResolvedValue({ id: 1 } as TourEntity);
    tourRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

    await expect(service.delete(1)).resolves.toEqual({ success: true });
    expect(tourRepository.delete).toHaveBeenCalledWith(1);
  });

  it('returns BadRequestException when create persistence fails', async () => {
    const tour = { title: 'Broken tour' } as TourEntity;
    categoryRepository.findOne.mockResolvedValue({ id: 1 } as CategoryEntity);
    tourRepository.create.mockReturnValue(tour);
    tourRepository.save.mockRejectedValue(new Error('Database error'));

    await expect(
      service.create({ category_id: 1, title: 'Broken tour' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns BadRequestException when update persistence fails', async () => {
    tourRepository.findOne.mockResolvedValue({ id: 1 } as TourEntity);
    tourRepository.save.mockRejectedValue(new Error('Database error'));

    await expect(service.update(1, { title: 'Broken update' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns BadRequestException when delete persistence fails', async () => {
    tourRepository.findOne.mockResolvedValue({ id: 1 } as TourEntity);
    tourRepository.delete.mockRejectedValue(new Error('Database error'));

    await expect(service.delete(1)).rejects.toThrow(BadRequestException);
  });

  it('rejects update and delete for a missing tour', async () => {
    tourRepository.findOne.mockResolvedValue(null);

    await expect(service.update(999, { title: 'Missing' })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.delete(999)).rejects.toThrow(NotFoundException);
  });
});
