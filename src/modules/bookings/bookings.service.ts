import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from 'src/common/constants';
import {
  BookingEntity,
  BookingStatus,
} from 'src/database/entities/booking.entity';
import {
  TourTimeEntity,
  TourTimeStatus,
} from 'src/database/entities/tour-time.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingDto } from './dto/list-booking.dto';
import { AdminListBookingDto } from './dto/admin-list-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingSerializer } from './serializers/booking.serializer';

const ACTIVE_BOOKING_STATUSES = [BookingStatus.PENDING, BookingStatus.APPROVED];

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async findAll(userId: number, queryParams: ListBookingDto) {
    const limit = queryParams.limit ?? DEFAULT_LIMIT;
    const offset = queryParams.offset ?? DEFAULT_OFFSET;
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoinAndSelect('booking.tourTime', 'tourTime')
      .innerJoinAndSelect('tourTime.tour', 'tour')
      .leftJoinAndSelect('tour.category', 'category')
      .leftJoinAndSelect('tour.images', 'image')
      .where('booking.userId = :userId', { userId })
      .orderBy('booking.createdAt', 'DESC')
      .addOrderBy('image.sortOrder', 'ASC')
      .skip(offset)
      .take(limit);
    const [bookings, bookingsCount] = await query.getManyAndCount();

    return {
      bookings: bookings.map((booking) =>
        new BookingSerializer(booking, { type: 'USER' }).serialize(),
      ),
      page: { total: bookingsCount, limit, offset },
    };
  }

  async findAllForAdmin(queryParams: AdminListBookingDto) {
    const limit = queryParams.limit ?? DEFAULT_LIMIT;
    const offset = queryParams.offset ?? DEFAULT_OFFSET;
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoinAndSelect('booking.user', 'user')
      .innerJoinAndSelect('booking.tourTime', 'tourTime')
      .innerJoinAndSelect('tourTime.tour', 'tour')
      .leftJoinAndSelect('tour.category', 'category')
      .leftJoinAndSelect('tour.images', 'image')
      .orderBy('booking.createdAt', 'DESC')
      .addOrderBy('image.sortOrder', 'ASC')
      .skip(offset)
      .take(limit);

    if (queryParams.status) {
      query.where('booking.status = :status', { status: queryParams.status });
    }

    const [bookings, bookingsCount] = await query.getManyAndCount();
    return {
      bookings: bookings.map((booking) =>
        new BookingSerializer(booking, { type: 'ADMIN' }).serialize(),
      ),
      page: { total: bookingsCount, limit, offset },
    };
  }

  async updateStatus(id: number, dto: UpdateBookingStatusDto) {
    try {
      const booking = await this.bookingRepository.findOne({ where: { id } });

      if (!booking) {
        throw new NotFoundException(
          this.i18n.t('common.notFound', { args: { field: 'Booking' } }),
        );
      }
      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException(
          this.i18n.t('common.booking.invalidTransition'),
        );
      }

      booking.status = dto.status;
      await this.bookingRepository.save(booking);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(this.i18n.t('common.invalid'));
    }
  }

  async create(userId: number, dto: CreateBookingDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const tourTimes = manager.getRepository(TourTimeEntity);
        const bookings = manager.getRepository(BookingEntity);
        const tourTime = await tourTimes
          .createQueryBuilder('tourTime')
          .setLock('pessimistic_write')
          .where('tourTime.id = :id', { id: dto.tour_time_id })
          .getOne();

        if (!tourTime) {
          throw new NotFoundException(
            this.i18n.t('common.notFound', {
              args: { field: 'Tour time' },
            }),
          );
        }
        if (tourTime.status !== TourTimeStatus.OPEN) {
          throw new ConflictException(
            this.i18n.t('common.booking.scheduleUnavailable'),
          );
        }
        if (tourTime.startDate <= new Date().toISOString().slice(0, 10)) {
          throw new ConflictException(this.i18n.t('common.booking.started'));
        }

        const existingBooking = await bookings.findOne({
          where: {
            userId,
            tourTimeId: tourTime.id,
            status: In(ACTIVE_BOOKING_STATUSES),
          },
        });
        if (existingBooking) {
          throw new ConflictException(this.i18n.t('common.booking.duplicate'));
        }

        const reservedSlots =
          (await bookings.sum('numberOfSlots', {
            tourTimeId: tourTime.id,
            status: In(ACTIVE_BOOKING_STATUSES),
          })) ?? 0;
        if (reservedSlots + dto.number_of_slots > tourTime.maxCapacity) {
          throw new ConflictException(
            this.i18n.t('common.booking.insufficientCapacity'),
          );
        }

        const booking = bookings.create({
          userId,
          tourTimeId: tourTime.id,
          numberOfSlots: dto.number_of_slots,
          status: BookingStatus.PENDING,
          totalPrice: (Number(tourTime.price) * dto.number_of_slots).toFixed(2),
        });

        await bookings.save(booking);

        return { success: true };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(this.i18n.t('common.invalid'));
    }
  }
}
