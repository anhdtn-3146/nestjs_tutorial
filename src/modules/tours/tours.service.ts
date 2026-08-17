import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { Repository } from 'typeorm';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from 'src/common/constants';
import { CreateTourDto } from './dto/create-tour.dto';
import { ListTourDto } from './dto/list-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(TourEntity)
    private readonly tourRepository: Repository<TourEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly i18n: I18nService,
  ) {}

  private async findTourByIdOrThrow(
    id: number,
    withCategory = false,
  ): Promise<TourEntity> {
    const tour = await this.tourRepository.findOne({
      where: { id },
      ...(withCategory ? { relations: { category: true } } : {}),
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
      .orderBy('tour.id', 'DESC');

    const limit = queryParams.limit ?? DEFAULT_LIMIT;
    const offset = queryParams.offset ?? DEFAULT_OFFSET;

    query.skip(offset).take(limit);

    const [tours, toursCount] = await query.getManyAndCount();

    return {
      tours,
      page: {
        total: toursCount,
        limit,
        offset,
      },
    };
  }

  findOne(id: number): Promise<TourEntity> {
    return this.findTourByIdOrThrow(id, true);
  }

  private async checkCategoryExists(categoryId: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', { args: { field: 'Category' } }),
      );
    }
  }

  async create(dto: CreateTourDto) {
    await this.checkCategoryExists(dto.category_id);

    try {
      const tour = this.tourRepository.create({
        categoryId: dto.category_id,
        title: dto.title,
        description: dto.description ?? null,
      });

      await this.tourRepository.save(tour);

      return { success: true };
    } catch {
      throw new BadRequestException(this.i18n.t('common.invalid'));
    }
  }

  async update(id: number, dto: UpdateTourDto) {
    const tour = await this.findTourByIdOrThrow(id);

    if (dto.category_id !== undefined) {
      await this.checkCategoryExists(dto.category_id);
      tour.categoryId = dto.category_id;
    }
    if (dto.title !== undefined) tour.title = dto.title;
    if (dto.description !== undefined) tour.description = dto.description;

    try {
      await this.tourRepository.save(tour);

      return { success: true };
    } catch {
      throw new BadRequestException(this.i18n.t('common.invalid'));
    }
  }

  async delete(id: number) {
    await this.findTourByIdOrThrow(id);

    try {
      await this.tourRepository.delete(id);

      return { success: true };
    } catch {
      throw new BadRequestException(this.i18n.t('common.invalid'));
    }
  }
}
