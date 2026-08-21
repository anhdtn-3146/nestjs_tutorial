import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { MAIL_QUEUE } from './mail.constants';
import { MailProcessor } from './mail.processor';
import { MailQueueService } from './mail-queue.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity]),
    BullModule.registerQueue({
      name: MAIL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
  ],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailQueueService],
})
export class MailModule {}
