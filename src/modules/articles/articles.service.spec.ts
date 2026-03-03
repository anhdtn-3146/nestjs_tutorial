import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { ArticleEntity } from 'src/database/entities/article.entity';
import { TagEntity } from 'src/database/entities/tag.entity';
import { UsersService } from '../users/users.service';
import { I18nService } from 'nestjs-i18n';
import { ListArticleDto } from './dto/list-article.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

jest.mock('slugify', () => jest.fn(() => 'mocked-slug'));

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let tagRepo: {
    createQueryBuilder: jest.Mock;
  };
  let userService: {
    findUserByIdOrThrow: jest.Mock;
  };
  let i18n: {
    t: jest.Mock;
  };

  beforeEach(async () => {
    articleRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    tagRepo = {
      createQueryBuilder: jest.fn(),
    };
    userService = {
      findUserByIdOrThrow: jest.fn(),
    };
    i18n = { t: jest.fn().mockReturnValue('mocked message') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(ArticleEntity), useValue: articleRepo },
        { provide: getRepositoryToken(TagEntity), useValue: tagRepo },
        { provide: UsersService, useValue: userService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const buildQueryMock = () => {
      const query = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      articleRepo.createQueryBuilder.mockReturnValue(query);
      return query;
    };

    it('should return all articles with no filter', async () => {
      const query = buildQueryMock();
      const params: ListArticleDto = {};
      const result = await service.findAll(params);
      expect(query.getMany).toHaveBeenCalled();
      expect(query.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should filter by tag', async () => {
      const query = buildQueryMock();
      const params: ListArticleDto = { tag: 'nestjs' };
      await service.findAll(params);
      expect(query.andWhere).toHaveBeenCalledWith('tags.name = :tag', {
        tag: 'nestjs',
      });
    });

    it('should filter by author', async () => {
      const query = buildQueryMock();
      const params: ListArticleDto = { author: 'john' };
      await service.findAll(params);
      expect(query.andWhere).toHaveBeenCalledWith(
        'author.username = :authorName',
        { authorName: 'john' },
      );
    });

    it('should filter by favorited', async () => {
      const query = buildQueryMock();
      const params: ListArticleDto = { favorited: 'jane' };
      await service.findAll(params);
      expect(query.andWhere).toHaveBeenCalledWith(
        'favorites.username = :favoriteName',
        { favoriteName: 'jane' },
      );
    });

    it('should apply offset and limit', async () => {
      const query = buildQueryMock();
      const params: ListArticleDto = { offset: 5, limit: 10 };
      await service.findAll(params);
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(query.take).toHaveBeenCalledWith(10);
    });
  });

  describe('findBySlug', () => {
    it('should return article if found', async () => {
      const article = { id: 1, slug: 'test-slug' } as ArticleEntity;
      articleRepo.findOne.mockResolvedValue(article);
      const result = await service.findBySlug('test-slug');
      expect(articleRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-slug' },
        relations: ['author', 'tagList'],
      });
      expect(result).toBe(article);
    });

    it('should throw BadRequestException if article not found', async () => {
      articleRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('not-found')).rejects.toThrow(
        BadRequestException,
      );
      expect(i18n.t).toHaveBeenCalledWith('common.notFound', {
        args: { field: 'Article' },
      });
    });
  });

  describe('create', () => {
    const mockAuthor = { id: 1, username: 'author' };
    const baseDto: CreateArticleDto = {
      title: 'Test',
      description: 'desc',
      body: 'body',
      tagList: [],
    };

    it('should create an article without tags', async () => {
      userService.findUserByIdOrThrow.mockResolvedValue(mockAuthor);
      articleRepo.findOne.mockResolvedValue(null);
      const mockArticle = {
        ...baseDto,
        slug: 'mocked-slug',
        author: mockAuthor,
      };
      articleRepo.create.mockReturnValue(mockArticle);
      articleRepo.save.mockResolvedValue(mockArticle);

      const result = await service.create(baseDto, 1);

      expect(userService.findUserByIdOrThrow).toHaveBeenCalledWith(1);
      expect(articleRepo.create).toHaveBeenCalled();
      expect(articleRepo.save).toHaveBeenCalledWith(mockArticle);
      expect(result).toEqual(mockArticle);
    });

    it('should create an article with valid tags', async () => {
      const dto: CreateArticleDto = { ...baseDto, tagList: ['nestjs'] };
      const mockTags = [{ id: 1, name: 'nestjs' }] as TagEntity[];
      const tagQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTags),
      };
      userService.findUserByIdOrThrow.mockResolvedValue(mockAuthor);
      articleRepo.findOne.mockResolvedValue(null);
      tagRepo.createQueryBuilder.mockReturnValue(tagQueryBuilder);
      const mockArticle = {
        ...dto,
        slug: 'mocked-slug',
        author: mockAuthor,
        tagList: mockTags,
      };
      articleRepo.create.mockReturnValue(mockArticle);
      articleRepo.save.mockResolvedValue(mockArticle);

      const result = await service.create(dto, 1);

      expect(tagQueryBuilder.where).toHaveBeenCalledWith(
        'tag.name IN (:...names)',
        { names: ['nestjs'] },
      );
      expect(result).toEqual(mockArticle);
    });

    it('should throw BadRequestException when tag is not found', async () => {
      const dto: CreateArticleDto = { ...baseDto, tagList: ['unknown-tag'] };
      const tagQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      userService.findUserByIdOrThrow.mockResolvedValue(mockAuthor);
      articleRepo.findOne.mockResolvedValue(null);
      tagRepo.createQueryBuilder.mockReturnValue(tagQueryBuilder);

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      userService.findUserByIdOrThrow.mockRejectedValue(
        new BadRequestException(),
      );
      await expect(service.create(baseDto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const mockArticle = {
      id: 1,
      slug: 'slug',
      title: 'old',
      author: { id: 1 },
    } as ArticleEntity;
    const dto: UpdateArticleDto = {
      title: 'new-title',
      description: '',
      body: '',
    };

    it('should update article successfully', async () => {
      articleRepo.findOne
        .mockResolvedValueOnce(mockArticle) // findBySlug
        .mockResolvedValueOnce(null); // generateUniqueSlug: slug available
      articleRepo.save.mockResolvedValue({});

      const result = await service.update('slug', dto, 1);

      expect(articleRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      articleRepo.findOne.mockResolvedValueOnce(mockArticle);
      await expect(service.update('slug', dto, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException on save error', async () => {
      articleRepo.findOne
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce(null);
      articleRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.update('slug', dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    const mockArticle = { id: 1, slug: 'slug', author: { id: 1 } };

    it('should delete article successfully', async () => {
      articleRepo.findOne.mockResolvedValue(mockArticle);
      articleRepo.delete.mockResolvedValue({});

      const result = await service.delete('slug', 1);

      expect(articleRepo.delete).toHaveBeenCalledWith({ slug: 'slug' });
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      articleRepo.findOne.mockResolvedValue(mockArticle);
      await expect(service.delete('slug', 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException on delete error', async () => {
      articleRepo.findOne.mockResolvedValue(mockArticle);
      articleRepo.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.delete('slug', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
