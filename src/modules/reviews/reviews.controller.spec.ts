import { IS_PUBLIC_KEY } from 'src/modules/auth/public.decorator';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  const reviewsService = { create: jest.fn() };
  const controller = new ReviewsController(
    reviewsService as unknown as ReviewsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a review for the authenticated user', async () => {
    const user = { sub: 7 } as never;
    const dto = { rating: 5, comment: 'Great tour' };
    reviewsService.create.mockResolvedValue({ success: true });

    await expect(controller.create(user, 2, dto)).resolves.toEqual({
      success: true,
    });
    expect(reviewsService.create).toHaveBeenCalledWith(7, 2, dto);
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, controller.create),
    ).toBeUndefined();
  });
});
