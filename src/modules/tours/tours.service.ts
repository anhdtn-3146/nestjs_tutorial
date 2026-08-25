import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  TOUR_IMAGE_EXTENSIONS,
} from 'src/common/constants';
import { today } from 'src/common/utils/date.util';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { TourImageEntity } from 'src/database/entities/tour-image.entity';
import {
  TourTimeEntity,
  TourTimeStatus,
} from 'src/database/entities/tour-time.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateTourTimeDto } from './dto/create-tour-time.dto';
import { CreateTourDto } from './dto/create-tour.dto';
import { EditTourTimeDto } from './dto/edit-tour-time.dto';
import { ListTourDto } from './dto/list-tour.dto';
import { SearchTourDto, SortOrder, TourSortBy } from './dto/search-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourSerializer } from './serializers/tour.serializer';
import { TourImageUpload } from './tour-upload.config';

interface StoredTourImage {
  filePath: string;
  imageUrl: string;
}

@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);

  constructor(
    @InjectRepository(TourEntity)
    private readonly tourRepository: Repository<TourEntity>,
    @InjectRepository(TourTimeEntity)
    private readonly tourTimeRepository: Repository<TourTimeEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async closeStartedTourTimes(): Promise<number> {
    const businessDate = today();
    const result = await this.tourTimeRepository
      .createQueryBuilder()
      .update(TourTimeEntity)
      .set({ status: TourTimeStatus.CLOSED })
      .where('status = :openStatus', { openStatus: TourTimeStatus.OPEN })
      .andWhere('start_date <= :businessDate', { businessDate })
      .andWhere('deleted_at IS NULL')
      .execute();
    const affected = result.affected ?? 0;

    this.logger.log(
      `Closed ${affected} started tour time(s) for ${businessDate}`,
    );

    return affected;
  }

  private async findTourByIdOrThrow(
    id: number,
    withRelations = false,
    repository: Repository<TourEntity> = this.tourRepository,
  ): Promise<TourEntity> {
    const tour = await repository.findOne({
      where: { id },
      ...(withRelations
        ? {
            relations: { category: true, tourTimes: true, images: true },
            order: {
              tourTimes: { startDate: 'ASC' as const },
              images: { sortOrder: 'ASC' as const },
            },
          }
        : {}),
    });
    if (!tour) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', { args: { field: 'Tour' } }),
      );
    }
    return tour;
  }

  async findAll(queryParams: ListTourDto) {
    const query = this.tourRepository
      .createQueryBuilder('tour')
      .leftJoinAndSelect('tour.category', 'category')
      .leftJoinAndSelect('tour.tourTimes', 'tourTime')
      .leftJoinAndSelect('tour.images', 'image')
      .orderBy('tour.id', 'DESC')
      .addOrderBy('tourTime.startDate', 'ASC')
      .addOrderBy('image.sortOrder', 'ASC');
    const limit = queryParams.limit ?? DEFAULT_LIMIT;
    const offset = queryParams.offset ?? DEFAULT_OFFSET;
    query.skip(offset).take(limit);
    const [tours, toursCount] = await query.getManyAndCount();
    return { tours, page: { total: toursCount, limit, offset } };
  }

  private createPublicTourQuery() {
    const currentDate = today();

    return this.tourRepository
      .createQueryBuilder('tour')
      .leftJoinAndSelect('tour.category', 'category')
      .innerJoinAndSelect(
        'tour.tourTimes',
        'tourTime',
        'tourTime.status = :status AND tourTime.startDate > :today',
        { status: TourTimeStatus.OPEN, today: currentDate },
      )
      .leftJoinAndSelect('tour.images', 'image');
  }

  async findPublic(queryParams: SearchTourDto) {
    const limit = queryParams.limit ?? DEFAULT_LIMIT;
    const offset = queryParams.offset ?? DEFAULT_OFFSET;
    if (
      queryParams.min_price !== undefined &&
      queryParams.max_price !== undefined &&
      queryParams.min_price > queryParams.max_price
    ) {
      throw new BadRequestException(
        this.i18n.t('common.tour.invalidPriceRange'),
      );
    }

    const query = this.createPublicTourQuery();
    if (queryParams.category_id !== undefined) {
      query.andWhere('tour.categoryId = :categoryId', {
        categoryId: queryParams.category_id,
      });
    }
    if (queryParams.name !== undefined) {
      query.andWhere('tour.title ILIKE :name', {
        name: `%${queryParams.name.trim()}%`,
      });
    }
    if (queryParams.min_price !== undefined) {
      query.andWhere('tourTime.price >= :minPrice', {
        minPrice: queryParams.min_price,
      });
    }
    if (queryParams.max_price !== undefined) {
      query.andWhere('tourTime.price <= :maxPrice', {
        maxPrice: queryParams.max_price,
      });
    }

    if (queryParams.sort_by === TourSortBy.RATING) {
      query.addSelect(
        (subQuery) =>
          subQuery
            .select('COALESCE(AVG(review.rating), 0)')
            .from(ReviewEntity, 'review')
            .where('review.tourId = tour.id'),
        'average_rating',
      );
    }

    const defaultSortOrder =
      queryParams.sort_by === TourSortBy.RATING ? 'DESC' : 'ASC';
    const sortOrder =
      queryParams.sort_order === SortOrder.DESC
        ? 'DESC'
        : queryParams.sort_order === SortOrder.ASC
          ? 'ASC'
          : defaultSortOrder;
    const sortColumns: Record<TourSortBy, string> = {
      [TourSortBy.PRICE]: 'tourTime.price',
      [TourSortBy.START_DATE]: 'tourTime.startDate',
      [TourSortBy.NAME]: 'tour.title',
      [TourSortBy.RATING]: 'average_rating',
    };
    if (queryParams.sort_by) {
      query
        .orderBy(sortColumns[queryParams.sort_by], sortOrder)
        .addOrderBy('tour.id', 'DESC');
    } else {
      query.orderBy('tour.id', 'DESC');
    }
    query
      .addOrderBy('tourTime.startDate', 'ASC')
      .addOrderBy('image.sortOrder', 'ASC')
      .skip(offset)
      .take(limit);
    const [tours, toursCount] = await query.getManyAndCount();

    return {
      tours: tours.map((tour) =>
        new TourSerializer(tour, { type: 'PUBLIC' }).serialize(),
      ),
      page: { total: toursCount, limit, offset },
    };
  }

  async findPublicOne(id: number) {
    const tour = await this.createPublicTourQuery()
      .where('tour.id = :id', { id })
      .orderBy('tourTime.startDate', 'ASC')
      .addOrderBy('image.sortOrder', 'ASC')
      .getOne();

    if (!tour) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', { args: { field: 'Tour' } }),
      );
    }

    return new TourSerializer(tour, { type: 'PUBLIC' }).serialize();
  }

  async findOne(id: number) {
    const tour = await this.findTourByIdOrThrow(id, true);
    const tourTimes = await Promise.all(
      tour.tourTimes.map(async (tourTime) => {
        const bookingCount = await this.bookingRepository.count({
          where: { tourTimeId: tourTime.id },
        });

        return {
          id: tourTime.id,
          tourId: tourTime.tourId,
          startDate: tourTime.startDate,
          endDate: tourTime.endDate,
          price: tourTime.price,
          maxCapacity: tourTime.maxCapacity,
          status: tourTime.status,
          hasBookings: bookingCount > 0,
        };
      }),
    );
    return { ...tour, tourTimes };
  }

  private async checkCategoryExists(
    categoryId: number,
    repository: Repository<CategoryEntity> = this.categoryRepository,
  ): Promise<void> {
    const category = await repository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', { args: { field: 'Category' } }),
      );
    }
  }

  private validateTimeRange(time: CreateTourTimeDto): void {
    if (time.end_date < time.start_date) {
      throw new BadRequestException(
        this.i18n.t('common.tourTime.invalidRange'),
      );
    }
  }

  private validateNewTimes(times: CreateTourTimeDto[]): void {
    times.forEach((time) => this.validateTimeRange(time));
    const sortedTimes = [...times].sort((a, b) =>
      a.start_date.localeCompare(b.start_date),
    );
    for (let index = 1; index < sortedTimes.length; index += 1) {
      if (sortedTimes[index].start_date <= sortedTimes[index - 1].end_date) {
        throw new ConflictException(this.i18n.t('common.tourTime.overlap'));
      }
    }
  }

  private validateEditedTimes(times: EditTourTimeDto[]): void {
    times.forEach((time) => this.validateTimeRange(time));
    const activeTimes = times
      .filter((time) => time.status !== TourTimeStatus.CANCELLED)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let index = 1; index < activeTimes.length; index += 1) {
      if (activeTimes[index].start_date <= activeTimes[index - 1].end_date) {
        throw new ConflictException(this.i18n.t('common.tourTime.overlap'));
      }
    }
  }

  private createTimeEntity(
    repository: Repository<TourTimeEntity>,
    tourId: number,
    dto: CreateTourTimeDto,
  ): TourTimeEntity {
    return repository.create({
      tourId,
      startDate: dto.start_date,
      endDate: dto.end_date,
      price: String(dto.price),
      maxCapacity: dto.max_capacity,
      status: TourTimeStatus.OPEN,
    });
  }

  private rethrowPersistenceError(error: unknown): never {
    if (error instanceof HttpException) throw error;
    throw new BadRequestException(this.i18n.t('common.invalid'));
  }

  private async ensureTourTimeHasNoBookings(
    tourTimeId: number,
    repository: Repository<BookingEntity> = this.bookingRepository,
  ): Promise<void> {
    const bookingCount = await repository.count({ where: { tourTimeId } });
    if (bookingCount > 0) {
      throw new ConflictException(this.i18n.t('common.tourTime.hasBookings'));
    }
  }

  private async storeTourImages(
    images: TourImageUpload[],
  ): Promise<StoredTourImage[]> {
    if (images.length === 0) return [];

    const uploadDirectory = join(process.cwd(), 'uploads', 'tours');
    await mkdir(uploadDirectory, { recursive: true });
    const storedImages: StoredTourImage[] = [];

    try {
      for (const image of images) {
        const extension = TOUR_IMAGE_EXTENSIONS[image.mimetype];
        const filename = `${randomUUID()}.${extension}`;
        const filePath = join(uploadDirectory, filename);
        await writeFile(filePath, image.buffer);
        storedImages.push({
          filePath,
          imageUrl: `/uploads/tours/${filename}`,
        });
      }
      return storedImages;
    } catch (error) {
      await this.cleanupTourImages(storedImages);
      throw error;
    }
  }

  private async cleanupTourImages(images: StoredTourImage[]): Promise<void> {
    await Promise.allSettled(images.map((image) => unlink(image.filePath)));
  }

  private createImageEntities(
    repository: Repository<TourImageEntity>,
    tourId: number,
    images: StoredTourImage[],
    initialSortOrder = 0,
  ): TourImageEntity[] {
    return images.map((image, index) =>
      repository.create({
        tourId,
        imageUrl: image.imageUrl,
        sortOrder: initialSortOrder + index,
      }),
    );
  }

  private validateExistingTimeIds(
    currentTimes: TourTimeEntity[],
    dto: UpdateTourDto,
  ): Map<number, TourTimeEntity> {
    const currentById = new Map(
      currentTimes.map((tourTime) => [tourTime.id, tourTime]),
    );
    const submittedIds = dto.tour_times.flatMap((tourTime) =>
      tourTime.id === undefined ? [] : [tourTime.id],
    );
    const deletedIds = dto.deleted_tour_time_ids ?? [];
    const handledIds = new Set([...submittedIds, ...deletedIds]);

    const hasDuplicateIds = new Set(submittedIds).size !== submittedIds.length;
    const hasForeignIds = [...handledIds].some((id) => !currentById.has(id));
    const hasUpdateDeleteConflict = submittedIds.some((id) =>
      deletedIds.includes(id),
    );

    if (hasDuplicateIds || hasForeignIds || hasUpdateDeleteConflict) {
      throw new BadRequestException(
        this.i18n.t('common.tourTime.invalidEditSet'),
      );
    }

    return currentById;
  }

  private validateResultingTimes(
    currentTimes: TourTimeEntity[],
    dto: UpdateTourDto,
  ): void {
    const deletedIds = new Set(dto.deleted_tour_time_ids ?? []);
    const submittedById = new Map(
      dto.tour_times.flatMap((time) =>
        time.id === undefined ? [] : [[time.id, time] as const],
      ),
    );
    const unchangedOrUpdatedTimes = currentTimes
      .filter((time) => !deletedIds.has(time.id))
      .map(
        (time) =>
          submittedById.get(time.id) ?? {
            id: time.id,
            start_date: time.startDate,
            end_date: time.endDate,
            price: Number(time.price),
            max_capacity: time.maxCapacity,
            status: time.status,
          },
      );
    const newTimes = dto.tour_times.filter((time) => time.id === undefined);

    this.validateEditedTimes([...unchangedOrUpdatedTimes, ...newTimes]);
  }

  private hasScheduleChanges(
    currentTime: TourTimeEntity,
    submittedTime: EditTourTimeDto,
  ): boolean {
    return (
      currentTime.startDate !== submittedTime.start_date ||
      currentTime.endDate !== submittedTime.end_date ||
      Number(currentTime.price) !== submittedTime.price ||
      currentTime.maxCapacity !== submittedTime.max_capacity
    );
  }

  private validateExistingTimeChange(
    currentTime: TourTimeEntity,
    submittedTime: EditTourTimeDto,
  ): { hasScheduleChanges: boolean; isCancelling: boolean } {
    const hasScheduleChanges = this.hasScheduleChanges(
      currentTime,
      submittedTime,
    );
    const hasStatusChange = currentTime.status !== submittedTime.status;
    const hasChanges = hasScheduleChanges || hasStatusChange;

    if (hasChanges && this.hasStarted(currentTime)) {
      throw new ConflictException(this.i18n.t('common.tourTime.started'));
    }
    if (hasChanges && currentTime.status === TourTimeStatus.CANCELLED) {
      throw new ConflictException(
        this.i18n.t('common.tourTime.invalidTransition'),
      );
    }

    return {
      hasScheduleChanges,
      isCancelling:
        hasStatusChange && submittedTime.status === TourTimeStatus.CANCELLED,
    };
  }

  private applySubmittedTime(
    currentTime: TourTimeEntity,
    submittedTime: EditTourTimeDto,
  ): TourTimeEntity {
    currentTime.startDate = submittedTime.start_date;
    currentTime.endDate = submittedTime.end_date;
    currentTime.price = String(submittedTime.price);
    currentTime.maxCapacity = submittedTime.max_capacity;
    currentTime.status = submittedTime.status;
    return currentTime;
  }

  private async prepareTimesToSave(
    tourId: number,
    submittedTimes: EditTourTimeDto[],
    currentById: Map<number, TourTimeEntity>,
    tourTimes: Repository<TourTimeEntity>,
    bookings: Repository<BookingEntity>,
  ): Promise<TourTimeEntity[]> {
    const timesToSave: TourTimeEntity[] = [];

    for (const submittedTime of submittedTimes) {
      if (submittedTime.id === undefined) {
        if (submittedTime.status === TourTimeStatus.CANCELLED) {
          throw new ConflictException(
            this.i18n.t('common.tourTime.invalidTransition'),
          );
        }
        const newTime = this.createTimeEntity(tourTimes, tourId, submittedTime);
        newTime.status = submittedTime.status;
        timesToSave.push(newTime);
        continue;
      }

      const currentTime = currentById.get(submittedTime.id) as TourTimeEntity;
      const { hasScheduleChanges, isCancelling } =
        this.validateExistingTimeChange(currentTime, submittedTime);

      if (hasScheduleChanges || isCancelling) {
        await this.ensureTourTimeHasNoBookings(currentTime.id, bookings);
      }
      timesToSave.push(this.applySubmittedTime(currentTime, submittedTime));
    }

    return timesToSave;
  }

  async create(
    dto: CreateTourDto,
    images: TourImageUpload[] = [],
  ): Promise<TourEntity> {
    await this.checkCategoryExists(dto.category_id);
    this.validateNewTimes(dto.tour_times);
    const storedImages = await this.storeTourImages(images);
    try {
      const tourId = await this.dataSource.transaction(async (manager) => {
        const tours = manager.getRepository(TourEntity);
        const tourTimes = manager.getRepository(TourTimeEntity);
        const tourImages = manager.getRepository(TourImageEntity);
        const tour = await tours.save(
          tours.create({
            categoryId: dto.category_id,
            title: dto.title,
            description: dto.description ?? null,
          }),
        );
        await tourTimes.save(
          dto.tour_times.map((time) =>
            this.createTimeEntity(tourTimes, tour.id, time),
          ),
        );
        if (storedImages.length > 0) {
          await tourImages.save(
            this.createImageEntities(tourImages, tour.id, storedImages),
          );
        }
        return tour.id;
      });
      return this.findTourByIdOrThrow(tourId, true);
    } catch (error) {
      await this.cleanupTourImages(storedImages);
      this.rethrowPersistenceError(error);
    }
  }

  private async updateTourTimes(
    tourId: number,
    dto: UpdateTourDto,
    tourTimes: Repository<TourTimeEntity>,
    bookings: Repository<BookingEntity>,
  ): Promise<void> {
    const currentTimes = await tourTimes.find({
      where: { tourId },
      order: { startDate: 'ASC' },
    });

    const currentById = this.validateExistingTimeIds(currentTimes, dto);

    this.validateResultingTimes(currentTimes, dto);

    const timesToSave = await this.prepareTimesToSave(
      tourId,
      dto.tour_times,
      currentById,
      tourTimes,
      bookings,
    );

    // soft delete
    const deletedIds = dto.deleted_tour_time_ids ?? [];

    for (const deletedId of deletedIds) {
      const deletedTime = currentById.get(deletedId) as TourTimeEntity;
      if (this.hasStarted(deletedTime)) {
        throw new ConflictException(this.i18n.t('common.tourTime.started'));
      }
      await this.ensureTourTimeHasNoBookings(deletedTime.id, bookings);
      await tourTimes.softRemove(deletedTime);
    }

    if (timesToSave.length > 0) {
      await tourTimes.save(timesToSave);
    }
  }

  async update(id: number, dto: UpdateTourDto, images: TourImageUpload[] = []) {
    const storedImages = await this.storeTourImages(images);
    try {
      await this.dataSource.transaction(async (manager) => {
        const tours = manager.getRepository(TourEntity);
        const tourTimes = manager.getRepository(TourTimeEntity);
        const bookings = manager.getRepository(BookingEntity);
        const categories = manager.getRepository(CategoryEntity);
        const tourImages = manager.getRepository(TourImageEntity);

        const tour = await this.findTourByIdOrThrow(id, false, tours);
        await this.checkCategoryExists(dto.category_id, categories);
        await this.updateTourTimes(id, dto, tourTimes, bookings);

        // update tour images
        if (storedImages.length > 0) {
          const imageCount = await tourImages.count({ where: { tourId: id } });
          await tourImages.save(
            this.createImageEntities(tourImages, id, storedImages, imageCount),
          );
        }
        // update tour info
        tour.categoryId = dto.category_id;
        tour.title = dto.title;
        tour.description = dto.description ?? null;
        await tours.save(tour);
      });

      return { success: true };
    } catch (error) {
      await this.cleanupTourImages(storedImages);
      this.rethrowPersistenceError(error);
    }
  }

  private hasStarted(tourTime: TourTimeEntity): boolean {
    return tourTime.startDate <= today();
  }

  async delete(id: number) {
    const tour = await this.findTourByIdOrThrow(id, true);
    const bookingCount = await this.bookingRepository.count({
      where: { tourTime: { tourId: id } },
    });
    if (bookingCount > 0) {
      throw new ConflictException(this.i18n.t('common.tour.hasBookings'));
    }
    try {
      await this.tourRepository.delete(id);
      const localImages = (tour.images ?? [])
        .filter((image) => image.imageUrl.startsWith('/uploads/tours/'))
        .map((image) => ({
          imageUrl: image.imageUrl,
          filePath: join(
            process.cwd(),
            'uploads',
            'tours',
            basename(image.imageUrl),
          ),
        }));
      await this.cleanupTourImages(localImages);

      return { success: true };
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }
}
