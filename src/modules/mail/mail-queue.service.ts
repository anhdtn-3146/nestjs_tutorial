import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { BOOKING_DECISION_JOB, MAIL_QUEUE } from './mail.constants';

export interface BookingDecisionJobData {
  bookingId: number;
}

@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue<BookingDecisionJobData>,
  ) {}

  async enqueueBookingDecision(
    bookingId: number,
    status: BookingStatus.APPROVED | BookingStatus.REJECTED,
  ): Promise<void> {
    await this.mailQueue.add(
      BOOKING_DECISION_JOB,
      { bookingId },
      { jobId: `${BOOKING_DECISION_JOB}:${bookingId}:${status}` },
    );
  }
}
