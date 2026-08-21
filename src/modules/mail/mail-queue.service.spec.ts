import type { Queue } from 'bull';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { BOOKING_DECISION_JOB } from './mail.constants';
import { MailQueueService } from './mail-queue.service';

describe('MailQueueService', () => {
  it('enqueues an idempotent booking decision job', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const service = new MailQueueService(
      queue as unknown as Queue<{ bookingId: number }>,
    );

    await service.enqueueBookingDecision(10, BookingStatus.APPROVED);

    expect(queue.add).toHaveBeenCalledWith(
      BOOKING_DECISION_JOB,
      { bookingId: 10 },
      { jobId: 'booking-decision:10:approved' },
    );
  });
});
