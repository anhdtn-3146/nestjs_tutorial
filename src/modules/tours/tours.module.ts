import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { TourTimeEntity } from 'src/database/entities/tour-time.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CloseStartedTourTimesProcessor } from './jobs/close-started-tour-times.processor';
import { CloseStartedTourTimesScheduler } from './jobs/close-started-tour-times.scheduler';
import { TOUR_JOBS_QUEUE } from './jobs/constants';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TourEntity,
      TourTimeEntity,
      BookingEntity,
      CategoryEntity,
    ]),
    BullModule.registerQueue({
      name: TOUR_JOBS_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    }),
  ],
  controllers: [ToursController],
  providers: [
    ToursService,
    RolesGuard,
    CloseStartedTourTimesScheduler,
    CloseStartedTourTimesProcessor,
  ],
})
export class ToursModule {}
