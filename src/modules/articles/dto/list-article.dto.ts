import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from 'src/common/constants';

export class ListArticleDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  favorited?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = DEFAULT_LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number = DEFAULT_OFFSET;
}
