import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ListArticleDto } from './dto/list-article.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let mockArticlesService: {
    findAll: jest.Mock;
    create: jest.Mock;
    findBySlug: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    mockArticlesService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      const queryParams: ListArticleDto = { tag: 'nestjs' };
      const articles = [{ slug: 'a' }, { slug: 'b' }];
      mockArticlesService.findAll.mockResolvedValue(articles);
      const result = await controller.findAll(queryParams);
      expect(mockArticlesService.findAll).toHaveBeenCalledWith(queryParams);
      expect(result).toBe(articles);
    });
  });

  describe('create', () => {
    it('should create an article', async () => {
      const dto: CreateArticleDto = {
        title: 't',
        description: 'd',
        body: 'b',
        tagList: [],
      };
      const req = { user: { sub: 1 } };
      const article = { slug: 'slug', ...dto };
      mockArticlesService.create.mockResolvedValue(article);
      const result = await controller.create(dto, req);
      expect(mockArticlesService.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toBe(article);
    });
  });

  describe('detail', () => {
    it('should return article detail', async () => {
      const article = { slug: 'slug', title: 't' };
      mockArticlesService.findBySlug.mockResolvedValue(article);
      const result = await controller.detail('slug');
      expect(mockArticlesService.findBySlug).toHaveBeenCalledWith('slug');
      expect(result).toBe(article);
    });

    it('should throw NotFoundException if not found', async () => {
      mockArticlesService.findBySlug.mockRejectedValue(new NotFoundException());
      await expect(controller.detail('notfound')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateArticleDto = {
      title: 'new',
      description: 'desc',
      body: 'body',
    };

    const req = { user: { sub: 1 } };

    it('should update an article', async () => {
      const article = { slug: 'slug', ...dto };
      mockArticlesService.update.mockResolvedValue(article);
      const result = await controller.update('slug', dto, req);
      expect(mockArticlesService.update).toHaveBeenCalledWith('slug', dto, 1);
      expect(result).toBe(article);
    });

    it('should throw BadRequestException on update error', async () => {
      mockArticlesService.update.mockRejectedValue(new BadRequestException());
      await expect(controller.update('slug', dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    const req = { user: { sub: 1 } };
    it('should delete an article', async () => {
      mockArticlesService.delete.mockResolvedValue({ success: true });
      const result = await controller.delete('slug', req);
      expect(mockArticlesService.delete).toHaveBeenCalledWith('slug', 1);
      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException on delete error', async () => {
      mockArticlesService.delete.mockRejectedValue(new BadRequestException());
      await expect(controller.delete('slug', req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
