import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  BookingEntity,
  BookingStatus,
} from 'src/database/entities/booking.entity';
import {
  TourTimeEntity,
  TourTimeStatus,
} from 'src/database/entities/tour-time.entity';
import { DataSource, Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { MailQueueService } from 'src/modules/mail/mail-queue.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let tourTime: TourTimeEntity | null;
  let bookings: jest.Mocked<Partial<Repository<BookingEntity>>>;
  let mailQueueService: { enqueueBookingDecision: jest.Mock };
  let queryBuilder: {
    setLock: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };

  beforeEach(() => {
    tourTime = {
      id: 5,
      tourId: 2,
      startDate: '2999-01-01',
      endDate: '2999-01-03',
      price: '2500000.00',
      maxCapacity: 20,
      status: TourTimeStatus.OPEN,
    } as TourTimeEntity;
    queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => tourTime),
    };
    const tourTimes = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    bookings = {
      findOne: jest.fn().mockResolvedValue(null),
      sum: jest.fn().mockResolvedValue(5),
      create: jest.fn((value) => value as BookingEntity),
      save: jest.fn(async (value) => ({ id: 10, ...value }) as BookingEntity),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity: unknown) =>
            entity === TourTimeEntity ? tourTimes : bookings,
        }),
      ),
    };
    mailQueueService = {
      enqueueBookingDecision: jest.fn().mockResolvedValue(undefined),
    };
    service = new BookingsService(
      bookings as Repository<BookingEntity>,
      dataSource as unknown as DataSource,
      { t: jest.fn((key: string) => key) } as unknown as I18nService,
      mailQueueService as unknown as MailQueueService,
    );
  });

  it('returns only the authenticated user booking history with pagination', async () => {
    const booking = {
      id: 10,
      userId: 7,
      numberOfSlots: 2,
      status: BookingStatus.APPROVED,
      totalPrice: '5000000.00',
      createdAt: new Date('2026-08-19T00:00:00.000Z'),
      tourTime: {
        id: 5,
        tourId: 2,
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        price: '2500000.00',
        maxCapacity: 20,
        status: TourTimeStatus.OPEN,
        tour: {
          id: 2,
          categoryId: 1,
          category: { id: 1, name: 'Beach' },
          title: 'Da Nang',
          description: 'Three days',
          images: [
            {
              id: 8,
              imageUrl: '/uploads/tours/image.jpg',
              sortOrder: 0,
            },
          ],
        },
      },
    } as BookingEntity;
    const listQueryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[booking], 1]),
    };
    bookings.createQueryBuilder = jest.fn().mockReturnValue(listQueryBuilder);

    await expect(service.findAll(7, { limit: 10, offset: 0 })).resolves.toEqual(
      {
        bookings: [
          {
            id: 10,
            numberOfSlots: 2,
            status: BookingStatus.APPROVED,
            totalPrice: '5000000.00',
            tourTime: {
              id: 5,
              startDate: '2999-01-01',
              endDate: '2999-01-03',
            },
            tour: {
              id: 2,
              name: 'Da Nang',
              category: 'Beach',
              images: [
                {
                  id: 8,
                  imageUrl: '/uploads/tours/image.jpg',
                  sortOrder: 0,
                },
              ],
            },
          },
        ],
        page: { total: 1, limit: 10, offset: 0 },
      },
    );
    expect(listQueryBuilder.where).toHaveBeenCalledWith(
      'booking.userId = :userId',
      { userId: 7 },
    );
  });

  it('returns paginated booking requests for admin with a status filter', async () => {
    const booking = {
      id: 10,
      userId: 7,
      user: {
        id: 7,
        fullName: 'Nguyen Van A',
        email: 'user@example.com',
        phone: '0900000000',
      },
      numberOfSlots: 2,
      status: BookingStatus.PENDING,
      totalPrice: '5000000.00',
      createdAt: new Date('2026-08-19T00:00:00.000Z'),
      tourTime: {
        id: 5,
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        tour: {
          id: 2,
          title: 'Da Nang',
          category: { name: 'Beach' },
          images: [],
        },
      },
    } as BookingEntity;
    const adminQueryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[booking], 1]),
    };
    bookings.createQueryBuilder = jest.fn().mockReturnValue(adminQueryBuilder);

    await expect(
      service.findAllForAdmin({
        limit: 10,
        offset: 0,
        status: BookingStatus.PENDING,
      }),
    ).resolves.toEqual({
      bookings: [
        {
          id: 10,
          numberOfSlots: 2,
          status: BookingStatus.PENDING,
          totalPrice: '5000000.00',
          tourTime: {
            id: 5,
            startDate: '2999-01-01',
            endDate: '2999-01-03',
          },
          tour: {
            id: 2,
            name: 'Da Nang',
            category: 'Beach',
            images: [],
          },
          user: {
            id: 7,
            name: 'Nguyen Van A',
            email: 'user@example.com',
            phone: '0900000000',
          },
          createdAt: new Date('2026-08-19T00:00:00.000Z'),
        },
      ],
      page: { total: 1, limit: 10, offset: 0 },
    });
    expect(adminQueryBuilder.where).toHaveBeenCalledWith(
      'booking.status = :status',
      { status: BookingStatus.PENDING },
    );
  });

  it('allows admin to approve a pending booking', async () => {
    const booking = {
      id: 10,
      status: BookingStatus.PENDING,
      numberOfSlots: 2,
      totalPrice: '5000000.00',
      user: {
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
      },
      tourTime: {
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        tour: { title: 'Da Nang' },
      },
    } as BookingEntity;
    bookings.findOne!.mockResolvedValue(booking);

    await expect(
      service.updateStatus(10, { status: BookingStatus.APPROVED }),
    ).resolves.toEqual({ success: true });
    expect(bookings.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
    });
    expect(bookings.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, status: BookingStatus.APPROVED }),
    );
    expect(mailQueueService.enqueueBookingDecision).toHaveBeenCalledWith(
      10,
      BookingStatus.APPROVED,
    );
  });

  it('returns a server error when the mail job cannot be enqueued', async () => {
    const booking = {
      id: 10,
      status: BookingStatus.PENDING,
      numberOfSlots: 1,
      totalPrice: '2500000.00',
      user: { email: 'user@example.com', fullName: 'Nguyen Van A' },
      tourTime: {
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        tour: { title: 'Da Nang' },
      },
    } as BookingEntity;
    bookings.findOne!.mockResolvedValue(booking);
    mailQueueService.enqueueBookingDecision.mockRejectedValue(
      new Error('Redis unavailable'),
    );

    await expect(
      service.updateStatus(10, { status: BookingStatus.REJECTED }),
    ).rejects.toThrow(InternalServerErrorException);
    expect(bookings.save).toHaveBeenCalled();
  });

  it('rejects an admin decision for a non-pending booking', async () => {
    const booking = {
      id: 10,
      status: BookingStatus.APPROVED,
    } as BookingEntity;
    bookings.findOne!.mockResolvedValue(booking);

    await expect(
      service.updateStatus(10, { status: BookingStatus.REJECTED }),
    ).rejects.toThrow(ConflictException);
  });

  it('returns an internal server error when updating status unexpectedly fails', async () => {
    bookings.findOne!.mockRejectedValue(new Error('database unavailable'));

    const result = service.updateStatus(10, {
      status: BookingStatus.APPROVED,
    });

    await expect(result).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(result).rejects.toMatchObject({
      response: {
        message: 'common.internalServerError',
        statusCode: 500,
      },
    });
  });

  it('allows the owner to cancel a pending booking', async () => {
    bookings.findOne!.mockResolvedValue({
      id: 10,
      userId: 7,
      status: BookingStatus.PENDING,
    } as BookingEntity);

    await expect(service.cancel(7, 10)).resolves.toEqual({ success: true });
    expect(bookings.findOne).toHaveBeenCalledWith({
      where: { id: 10, userId: 7 },
      select: { id: true, status: true },
    });
    expect(bookings.update).toHaveBeenCalledWith(
      { id: 10, userId: 7, status: BookingStatus.PENDING },
      { status: BookingStatus.CANCELLED },
    );
  });

  it('does not reveal a booking that does not belong to the user', async () => {
    bookings.findOne!.mockResolvedValue(null);

    await expect(service.cancel(7, 10)).rejects.toThrow(NotFoundException);
    expect(bookings.update).not.toHaveBeenCalled();
  });

  it('rejects cancellation after the admin has confirmed the booking', async () => {
    bookings.findOne!.mockResolvedValue({
      id: 10,
      userId: 7,
      status: BookingStatus.APPROVED,
    } as BookingEntity);

    await expect(service.cancel(7, 10)).rejects.toThrow(ConflictException);
    expect(bookings.update).not.toHaveBeenCalled();
  });

  it('does not overwrite an admin decision made during cancellation', async () => {
    bookings.findOne!.mockResolvedValue({
      id: 10,
      userId: 7,
      status: BookingStatus.PENDING,
    } as BookingEntity);
    bookings.update!.mockResolvedValue({ affected: 0 } as never);

    await expect(service.cancel(7, 10)).rejects.toThrow(ConflictException);
  });

  it('creates a pending booking and calculates its price on the server', async () => {
    await expect(
      service.create(7, { tour_time_id: 5, number_of_slots: 2 }),
    ).resolves.toEqual({ success: true });
    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(bookings.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        tourTimeId: 5,
        numberOfSlots: 2,
        status: BookingStatus.PENDING,
        totalPrice: '5000000.00',
      }),
    );
  });

  it('rejects a missing departure', async () => {
    tourTime = null;

    await expect(
      service.create(7, { tour_time_id: 99, number_of_slots: 1 }),
    ).rejects.toThrow(NotFoundException);
  });

  it.each([
    {
      caseName: 'closed',
      change: () => {
        (tourTime as TourTimeEntity).status = TourTimeStatus.CLOSED;
      },
    },
    {
      caseName: 'started',
      change: () => {
        (tourTime as TourTimeEntity).startDate = '2020-01-01';
      },
    },
  ])('rejects a $caseName departure', async ({ change }) => {
    change();

    await expect(
      service.create(7, { tour_time_id: 5, number_of_slots: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a duplicate active booking', async () => {
    bookings.findOne!.mockResolvedValue({ id: 9 } as BookingEntity);

    await expect(
      service.create(7, { tour_time_id: 5, number_of_slots: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a request that exceeds remaining capacity', async () => {
    bookings.sum!.mockResolvedValue(19);

    await expect(
      service.create(7, { tour_time_id: 5, number_of_slots: 2 }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs and converts an unexpected persistence error to a server error', async () => {
    bookings.save!.mockRejectedValue(new Error('database unavailable'));
    const loggerError = jest
      .spyOn(
        (
          service as unknown as {
            logger: { error: (message: string, trace: string) => void };
          }
        ).logger,
        'error',
      )
      .mockImplementation();

    const result = service.create(7, {
      tour_time_id: 5,
      number_of_slots: 1,
    });

    await expect(result).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(result).rejects.toMatchObject({
      response: {
        message: 'common.internalServerError',
        statusCode: 500,
      },
    });
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to create booking',
      expect.stringContaining('database unavailable'),
    );
  });
});
