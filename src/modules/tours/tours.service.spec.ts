import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import {
  TourTimeEntity,
  TourTimeStatus,
} from 'src/database/entities/tour-time.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { DataSource, Repository } from 'typeorm';
import { ToursService } from './tours.service';

describe('ToursService', () => {
  let service: ToursService;
  let tours: jest.Mocked<Partial<Repository<TourEntity>>>;
  let bookings: jest.Mocked<Partial<Repository<BookingEntity>>>;
  let categories: jest.Mocked<Partial<Repository<CategoryEntity>>>;
  let transactionTours: jest.Mocked<Partial<Repository<TourEntity>>>;
  let transactionTimes: jest.Mocked<Partial<Repository<TourTimeEntity>>>;

  beforeEach(async () => {
    transactionTours = {
      create: jest.fn((value) => value as TourEntity),
      save: jest.fn(async (value) => ({ id: 1, ...value }) as TourEntity),
      findOneByOrFail: jest.fn(),
      findOne: jest.fn(),
    };
    transactionTimes = {
      create: jest.fn((value) => value as TourTimeEntity),
      save: jest.fn(async (value) => value as TourTimeEntity),
      find: jest.fn(),
      softRemove: jest.fn(),
    };
    tours = {
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    bookings = { count: jest.fn().mockResolvedValue(0) };
    categories = { findOne: jest.fn() };
    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity: unknown) => {
            if (entity === TourEntity) return transactionTours;
            if (entity === TourTimeEntity) return transactionTimes;
            if (entity === BookingEntity) return bookings;
            return categories;
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToursService,
        { provide: getRepositoryToken(TourEntity), useValue: tours },
        { provide: getRepositoryToken(BookingEntity), useValue: bookings },
        { provide: getRepositoryToken(CategoryEntity), useValue: categories },
        { provide: DataSource, useValue: dataSource },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();
    service = module.get(ToursService);
  });

  it('creates one tour and multiple times atomically', async () => {
    categories.findOne!.mockResolvedValue({ id: 2 } as CategoryEntity);
    tours.findOne!.mockResolvedValue({ id: 1, tourTimes: [] } as TourEntity);
    const dto = {
      category_id: 2,
      title: 'Da Nang discovery',
      tour_times: [
        {
          start_date: '2030-01-01',
          end_date: '2030-01-03',
          price: 100,
          max_capacity: 20,
        },
        {
          start_date: '2030-02-01',
          end_date: '2030-02-03',
          price: 120,
          max_capacity: 15,
        },
      ],
    };

    await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
    expect(transactionTimes.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tourId: 1, status: TourTimeStatus.OPEN }),
      ]),
    );
  });

  it('requires an existing category', async () => {
    categories.findOne!.mockResolvedValue(null);
    await expect(
      service.create({
        category_id: 99,
        title: 'Missing',
        tour_times: [
          {
            start_date: '2030-01-01',
            end_date: '2030-01-02',
            price: 10,
            max_capacity: 1,
          },
        ],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects overlapping times in the same request', async () => {
    categories.findOne!.mockResolvedValue({ id: 1 } as CategoryEntity);
    await expect(
      service.create({
        category_id: 1,
        title: 'Overlap',
        tour_times: [
          {
            start_date: '2030-01-01',
            end_date: '2030-01-05',
            price: 10,
            max_capacity: 1,
          },
          {
            start_date: '2030-01-05',
            end_date: '2030-01-06',
            price: 10,
            max_capacity: 1,
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('returns booking flags used by the edit form', async () => {
    tours.findOne!.mockResolvedValue({
      id: 1,
      tourTimes: [
        {
          id: 5,
          tourId: 1,
          startDate: '2030-01-01',
          endDate: '2030-01-03',
          price: '2500000.00',
          maxCapacity: 20,
          status: TourTimeStatus.OPEN,
          deletedAt: null,
        } as TourTimeEntity,
      ],
    } as TourEntity);
    bookings.count!.mockResolvedValue(2);

    await expect(service.findOne(1)).resolves.toEqual({
      id: 1,
      tourTimes: [
        {
          id: 5,
          tourId: 1,
          startDate: '2030-01-01',
          endDate: '2030-01-03',
          price: '2500000.00',
          maxCapacity: 20,
          status: TourTimeStatus.OPEN,
          hasBookings: true,
        },
      ],
    });
  });

  it.each([
    { caseName: 'duplicate IDs', submittedIds: [5, 5], deletedIds: [6] },
    { caseName: 'foreign IDs', submittedIds: [99], deletedIds: [5, 6] },
    {
      caseName: 'update-delete conflict',
      submittedIds: [5],
      deletedIds: [5, 6],
    },
  ])('rejects invalid submitted IDs: $caseName', async (testCase) => {
    transactionTours.findOne!.mockResolvedValue({ id: 1 } as TourEntity);
    transactionTimes.find!.mockResolvedValue([
      { id: 5, tourId: 1 } as TourTimeEntity,
      { id: 6, tourId: 1 } as TourTimeEntity,
    ]);
    categories.findOne!.mockResolvedValue({ id: 1 } as CategoryEntity);

    await expect(
      service.update(1, {
        category_id: 1,
        title: 'Invalid snapshot',
        tour_times: testCase.submittedIds.map((id) => ({
          id,
          start_date: '2030-01-01',
          end_date: '2030-01-02',
          price: 10,
          max_capacity: 10,
          status: TourTimeStatus.OPEN,
        })),
        deleted_tour_time_ids: testCase.deletedIds,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps existing times that are omitted from the update payload', async () => {
    const submittedTime = {
      id: 5,
      tourId: 1,
      startDate: '2030-01-01',
      endDate: '2030-01-02',
      price: '10.00',
      maxCapacity: 10,
      status: TourTimeStatus.OPEN,
    } as TourTimeEntity;
    const omittedTime = {
      id: 6,
      tourId: 1,
      startDate: '2030-03-01',
      endDate: '2030-03-02',
      price: '30.00',
      maxCapacity: 10,
      status: TourTimeStatus.OPEN,
    } as TourTimeEntity;
    transactionTours.findOne!.mockResolvedValue({ id: 1 } as TourEntity);
    transactionTimes.find!.mockResolvedValue([submittedTime, omittedTime]);
    categories.findOne!.mockResolvedValue({ id: 1 } as CategoryEntity);

    await expect(
      service.update(1, {
        category_id: 1,
        title: 'Partial schedule update',
        tour_times: [
          {
            id: 5,
            start_date: '2030-01-01',
            end_date: '2030-01-02',
            price: 10,
            max_capacity: 10,
            status: TourTimeStatus.OPEN,
          },
        ],
      }),
    ).resolves.toEqual({ success: true });

    expect(transactionTimes.save).toHaveBeenCalledWith([submittedTime]);
    expect(transactionTimes.softRemove).not.toHaveBeenCalled();
  });

  it('saves existing and new times from the complete edit form', async () => {
    const currentTime = {
      id: 5,
      tourId: 1,
      startDate: '2030-01-01',
      endDate: '2030-01-02',
      price: '10.00',
      maxCapacity: 10,
      status: TourTimeStatus.OPEN,
    } as TourTimeEntity;
    const deletedTime = {
      id: 6,
      tourId: 1,
      startDate: '2030-03-01',
      endDate: '2030-03-02',
      price: '30.00',
      maxCapacity: 10,
      status: TourTimeStatus.OPEN,
    } as TourTimeEntity;
    transactionTours.findOne!.mockResolvedValue({
      id: 1,
    } as TourEntity);
    transactionTimes.find!.mockResolvedValue([currentTime, deletedTime]);
    categories.findOne!.mockResolvedValue({ id: 1 } as CategoryEntity);
    await expect(
      service.update(1, {
        category_id: 1,
        title: 'Complete edit',
        tour_times: [
          {
            id: 5,
            start_date: '2030-01-01',
            end_date: '2030-01-02',
            price: 10,
            max_capacity: 10,
            status: TourTimeStatus.CLOSED,
          },
          {
            start_date: '2030-02-01',
            end_date: '2030-02-02',
            price: 20,
            max_capacity: 20,
            status: TourTimeStatus.OPEN,
          },
        ],
        deleted_tour_time_ids: [6],
      }),
    ).resolves.toEqual({ success: true });
    expect(transactionTimes.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 5, status: TourTimeStatus.CLOSED }),
        expect.objectContaining({ tourId: 1, status: TourTimeStatus.OPEN }),
      ]),
    );
    expect(transactionTimes.softRemove).toHaveBeenCalledWith(deletedTime);
  });

  it('rejects cancelling a booked time in full edit', async () => {
    transactionTours.findOne!.mockResolvedValue({
      id: 1,
    } as TourEntity);
    transactionTimes.find!.mockResolvedValue([
      {
        id: 5,
        tourId: 1,
        startDate: '2030-01-01',
        endDate: '2030-01-02',
        price: '10.00',
        maxCapacity: 10,
        status: TourTimeStatus.OPEN,
      } as TourTimeEntity,
    ]);
    categories.findOne!.mockResolvedValue({ id: 1 } as CategoryEntity);
    bookings.count!.mockResolvedValue(1);

    await expect(
      service.update(1, {
        category_id: 1,
        title: 'Cancel booked time',
        tour_times: [
          {
            id: 5,
            start_date: '2030-01-01',
            end_date: '2030-01-02',
            price: 10,
            max_capacity: 10,
            status: TourTimeStatus.CANCELLED,
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it.each([
    {
      caseName: 'started time',
      startDate: '2020-01-01',
      currentStatus: TourTimeStatus.OPEN,
      submittedStatus: TourTimeStatus.CLOSED,
    },
    {
      caseName: 'cancelled time',
      startDate: '2030-01-01',
      currentStatus: TourTimeStatus.CANCELLED,
      submittedStatus: TourTimeStatus.OPEN,
    },
  ])('rejects changing a $caseName', async (testCase) => {
    transactionTours.findOne!.mockResolvedValue({ id: 1 } as TourEntity);
    transactionTimes.find!.mockResolvedValue([
      {
        id: 5,
        tourId: 1,
        startDate: testCase.startDate,
        endDate: testCase.startDate,
        price: '10.00',
        maxCapacity: 10,
        status: testCase.currentStatus,
      } as TourTimeEntity,
    ]);
    categories.findOne!.mockResolvedValue({ id: 1 } as CategoryEntity);

    await expect(
      service.update(1, {
        category_id: 1,
        title: 'Invalid transition',
        tour_times: [
          {
            id: 5,
            start_date: testCase.startDate,
            end_date: testCase.startDate,
            price: 10,
            max_capacity: 10,
            status: testCase.submittedStatus,
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('does not delete a tour with booking history', async () => {
    tours.findOne!.mockResolvedValue({ id: 1 } as TourEntity);
    bookings.count!.mockResolvedValue(1);
    await expect(service.delete(1)).rejects.toThrow(ConflictException);
    expect(tours.delete).not.toHaveBeenCalled();
  });
});
