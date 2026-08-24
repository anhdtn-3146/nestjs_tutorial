import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { today } from 'src/common/utils/date.util';
import {
  BookingEntity,
  BookingStatus,
} from 'src/database/entities/booking.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(TourEntity)
    private readonly tourRepository: Repository<TourEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly i18n: I18nService,
  ) {}

  async create(userId: number, tourId: number, dto: CreateReviewDto) {
    try {
      const tourExists = await this.tourRepository.existsBy({ id: tourId });
      if (!tourExists) {
        throw new NotFoundException(
          this.i18n.t('common.notFound', { args: { field: 'Tour' } }),
        );
      }

      const hasCompletedTour = await this.bookingRepository.exists({
        where: {
          userId,
          status: BookingStatus.APPROVED,
          tourTime: {
            tourId,
            endDate: LessThan(today()),
          },
        },
      });
      if (!hasCompletedTour) {
        throw new ForbiddenException(this.i18n.t('common.review.notCompleted'));
      }

      const review = this.reviewRepository.create({
        userId,
        tourId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      });
      await this.reviewRepository.save(review);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        'Failed to create review',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        this.i18n.t('common.internalServerError'),
      );
    }
  }
}
