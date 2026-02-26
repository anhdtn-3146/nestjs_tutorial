import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ListArticleDto } from './dto/list-article.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async findAll(@Query() queryParams: ListArticleDto) {
    return this.articlesService.findAll(queryParams);
  }

  @Post()
  async create(@Body() createArticleDto: CreateArticleDto, @Req() req) {
    return this.articlesService.create(createArticleDto, req.user.sub);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Put(':slug')
  async update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req,
  ) {
    return this.articlesService.update(slug, updateArticleDto, req.user.sub);
  }

  @Delete(':slug')
  async delete(@Param('slug') slug: string, @Req() req) {
    return this.articlesService.delete(slug, req.user.sub);
  }
}
