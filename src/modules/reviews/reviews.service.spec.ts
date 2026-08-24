import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { today } from 'src/common/utils/date.util';
import {
  BookingEntity,
  BookingStatus,
} from 'src/database/entities/booking.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviews: jest.Mocked<Partial<Repository<ReviewEntity>>>;
  let tours: jest.Mocked<Partial<Repository<TourEntity>>>;
  let bookings: jest.Mocked<Partial<Repository<BookingEntity>>>;

  beforeEach(() => {
    reviews = {
      create: jest.fn((value) => value as ReviewEntity),
      save: jest.fn(async (value) => ({ id: 1, ...value }) as ReviewEntity),
    };
    tours = {
      existsBy: jest.fn().mockResolvedValue(true),
    };
    bookings = {
      exists: jest.fn().mockResolvedValue(true),
    };
    service = new ReviewsService(
      reviews as Repository<ReviewEntity>,
      tours as Repository<TourEntity>,
      bookings as Repository<BookingEntity>,
      { t: jest.fn((key: string) => key) } as unknown as I18nService,
    );
  });

  it('creates a review for an existing tour', async () => {
    await expect(
      service.create(7, 2, { rating: 5, comment: 'Great tour' }),
    ).resolves.toEqual({ success: true });

    expect(tours.existsBy).toHaveBeenCalledWith({ id: 2 });
    expect(bookings.exists).toHaveBeenCalledWith({
      where: {
        userId: 7,
        status: BookingStatus.APPROVED,
        tourTime: {
          tourId: 2,
          endDate: expect.objectContaining({
            _type: 'lessThan',
            _value: today(),
          }),
        },
      },
    });
    expect(reviews.create).toHaveBeenCalledWith({
      userId: 7,
      tourId: 2,
      rating: 5,
      comment: 'Great tour',
    });
    expect(reviews.save).toHaveBeenCalled();
  });

  it('stores a missing comment as null', async () => {
    await service.create(7, 2, { rating: 4 });

    expect(reviews.create).toHaveBeenCalledWith(
      expect.objectContaining({ comment: null }),
    );
  });

  it('rejects a review for a missing tour', async () => {
    tours.existsBy!.mockResolvedValue(false);

    await expect(service.create(7, 99, { rating: 5 })).rejects.toThrow(
      NotFoundException,
    );
    expect(reviews.save).not.toHaveBeenCalled();
  });

  it('rejects a review when the user has not completed the tour', async () => {
    bookings.exists!.mockResolvedValue(false);

    await expect(service.create(7, 2, { rating: 5 })).rejects.toThrow(
      ForbiddenException,
    );
    expect(reviews.save).not.toHaveBeenCalled();
  });
});
