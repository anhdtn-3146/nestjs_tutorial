import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bull';
import {
  BookingEntity,
  BookingStatus,
} from 'src/database/entities/booking.entity';
import { Repository } from 'typeorm';
import { BOOKING_DECISION_JOB, MAIL_QUEUE } from './mail.constants';
import type { BookingDecisionJobData } from './mail-queue.service';
import { MailService } from './mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly mailService: MailService,
  ) {}

  @Process(BOOKING_DECISION_JOB)
  async processBookingDecision(
    job: Job<BookingDecisionJobData>,
  ): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: job.data.bookingId },
      relations: { user: true, tourTime: { tour: true } },
    });

    if (!booking) {
      this.logger.warn(`Booking ${job.data.bookingId} no longer exists`);
      return;
    }
    if (
      booking.status !== BookingStatus.APPROVED &&
      booking.status !== BookingStatus.REJECTED
    ) {
      this.logger.warn(
        `Booking ${booking.id} has no email decision status: ${booking.status}`,
      );
      return;
    }

    await this.mailService.sendBookingDecision({
      to: booking.user.email,
      customerName: booking.user.fullName,
      bookingId: booking.id,
      tourName: booking.tourTime.tour.title,
      startDate: booking.tourTime.startDate,
      endDate: booking.tourTime.endDate,
      numberOfSlots: booking.numberOfSlots,
      totalPrice: booking.totalPrice,
      status: booking.status,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job<BookingDecisionJobData>, error: Error): void {
    this.logger.error(
      `Mail job ${job.id} failed for booking ${job.data.bookingId}`,
      error.stack,
    );
  }
}
