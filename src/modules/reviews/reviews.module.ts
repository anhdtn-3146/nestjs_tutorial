import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, TourEntity, BookingEntity]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
