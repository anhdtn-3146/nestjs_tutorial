import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from 'src/common/constants';

export class ListTourDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = DEFAULT_LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number = DEFAULT_OFFSET;
}
