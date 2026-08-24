import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchTourDto, SortOrder, TourSortBy } from './search-tour.dto';

describe('SearchTourDto', () => {
  it('parses valid filters and sorting', async () => {
    const dto = plainToInstance(SearchTourDto, {
      category_id: '2',
      name: '  Da Nang  ',
      min_price: '1000000',
      max_price: '3000000',
      sort_by: TourSortBy.PRICE,
      sort_order: SortOrder.DESC,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      category_id: 2,
      name: 'Da Nang',
      min_price: 1000000,
      max_price: 3000000,
      sort_by: TourSortBy.PRICE,
      sort_order: SortOrder.DESC,
    });
  });

  it('rejects invalid filters and sort values', async () => {
    const dto = plainToInstance(SearchTourDto, {
      category_id: '0',
      name: '   ',
      min_price: '-1',
      sort_by: 'created_at',
      sort_order: 'sideways',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts sorting by rating', async () => {
    const dto = plainToInstance(SearchTourDto, {
      sort_by: TourSortBy.RATING,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
