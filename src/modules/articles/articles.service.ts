import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ListArticleDto } from './dto/list-article.dto';
import { Repository } from 'typeorm';
import { ArticleEntity } from 'src/database/entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from 'src/common/constants';
import { CreateArticleDto } from './dto/create-article.dto';
import { TagEntity } from 'src/database/entities/tag.entity';
import { I18nService } from 'nestjs-i18n';
import slugify from 'slugify';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    private readonly userService: UsersService,
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(queryParams: ListArticleDto) {
    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tagList', 'tags')
      .leftJoin('article.favoritedBy', 'favorites');

    if (queryParams.tag) {
      query.andWhere('tags.name = :tag', { tag: queryParams.tag });
    }

    if (queryParams.author) {
      query.andWhere('author.username = :authorName', {
        authorName: queryParams.author,
      });
    }

    if (queryParams.favorited) {
      query.andWhere('favorites.username = :favoriteName', {
        favoriteName: queryParams.favorited,
      });
    }

    const limit = queryParams.limit ?? DEFAULT_LIMIT;
    const offset = queryParams.offset ?? DEFAULT_OFFSET;

    query.skip(offset).take(limit);

    const [articles, articlesCount] = await query.getManyAndCount();

    return {
      articles,
      page: {
        total: articlesCount,
        limit,
        offset,
      },
    };
  }

  async findBySlug(slug: string) {
    const article = await this.articleRepo.findOne({
      where: { slug },
      relations: ['author', 'tagList'],
    });

    if (!article) {
      throw new BadRequestException(
        this.i18n.t('common.notFound', { args: { field: 'Article' } }),
      );
    }

    return article;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      locale: 'vi',
    });

    // Ensure slug is unique
    let suffix = 1;
    let uniqueSlug = baseSlug;
    while (
      await this.articleRepo.findOne({
        where: { slug: uniqueSlug },
      })
    ) {
      uniqueSlug = `${baseSlug}-${suffix++}`;
    }

    return uniqueSlug;
  }

  async create(createArticleDto: CreateArticleDto, userId: number) {
    const author = await this.userService.findUserByIdOrThrow(userId);
    const slug = await this.generateUniqueSlug(createArticleDto.title);

    let tags: TagEntity[] = [];
    if (
      Array.isArray(createArticleDto.tagList) &&
      createArticleDto.tagList.length > 0
    ) {
      tags = await this.tagRepo
        .createQueryBuilder('tag')
        .where('tag.name IN (:...names)', { names: createArticleDto.tagList })
        .getMany();

      if (tags.length !== createArticleDto.tagList.length) {
        throw new BadRequestException(
          this.i18n.t('common.notFound', { args: { field: 'Tag' } }),
        );
      }
    }

    try {
      const article = this.articleRepo.create({
        ...createArticleDto,
        slug,
        tagList: tags,
        author,
      });

      await this.articleRepo.save(article);

      return { success: true };
    } catch {
      throw new BadRequestException(this.i18n.t('invalid'));
    }
  }

  async verifyArticleOwnership(slug: string, userId: number) {
    const existArticle = await this.findBySlug(slug);

    if (existArticle.author.id !== userId) {
      throw new ForbiddenException();
    }

    return existArticle;
  }

  async update(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    userId: number,
  ) {
    const existArticle = await this.verifyArticleOwnership(slug, userId);

    try {
      const newSlug = await this.generateUniqueSlug(updateArticleDto.title);

      await this.articleRepo.save({
        ...existArticle,
        ...updateArticleDto,
        slug: newSlug,
      });

      return { success: true };
    } catch {
      throw new BadRequestException(this.i18n.t('invalid'));
    }
  }

  async delete(slug: string, userId: number) {
    await this.verifyArticleOwnership(slug, userId);

    try {
      await this.articleRepo.delete({ slug });

      return { success: true };
    } catch {
      throw new BadRequestException(this.i18n.t('invalid'));
    }
  }
}
