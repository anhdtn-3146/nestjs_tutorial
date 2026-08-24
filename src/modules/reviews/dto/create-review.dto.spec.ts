import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReviewDto } from './create-review.dto';

describe('CreateReviewDto', () => {
  it.each([1, 5])('accepts rating %i', async (rating) => {
    const dto = plainToInstance(CreateReviewDto, { rating });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([0, 6, 1.5])('rejects invalid rating %s', async (rating) => {
    const dto = plainToInstance(CreateReviewDto, { rating });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
