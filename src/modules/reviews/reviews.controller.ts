import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AccessTokenPayload } from 'src/modules/auth/auth.types';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('tours/:tourId/reviews')
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.sub, tourId, dto);
  }
}
