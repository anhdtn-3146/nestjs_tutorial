import type { Job } from 'bull';
import {
  BookingEntity,
  BookingStatus,
} from 'src/database/entities/booking.entity';
import { Repository } from 'typeorm';
import type { BookingDecisionJobData } from './mail-queue.service';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

describe('MailProcessor', () => {
  let bookings: jest.Mocked<Partial<Repository<BookingEntity>>>;
  let mailService: { sendBookingDecision: jest.Mock };
  let processor: MailProcessor;
  const job = {
    id: 'job-1',
    data: { bookingId: 10 },
  } as Job<BookingDecisionJobData>;

  beforeEach(() => {
    bookings = { findOne: jest.fn() };
    mailService = {
      sendBookingDecision: jest.fn().mockResolvedValue(undefined),
    };
    processor = new MailProcessor(
      bookings as Repository<BookingEntity>,
      mailService as unknown as MailService,
    );
  });

  it('loads the latest booking data and sends the decision email', async () => {
    bookings.findOne!.mockResolvedValue({
      id: 10,
      status: BookingStatus.APPROVED,
      numberOfSlots: 2,
      totalPrice: '5000000.00',
      user: { email: 'user@example.com', fullName: 'Nguyen Van A' },
      tourTime: {
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        tour: { title: 'Da Nang' },
      },
    } as BookingEntity);

    await processor.processBookingDecision(job);

    expect(bookings.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: { user: true, tourTime: { tour: true } },
    });
    expect(mailService.sendBookingDecision).toHaveBeenCalledWith({
      to: 'user@example.com',
      customerName: 'Nguyen Van A',
      bookingId: 10,
      tourName: 'Da Nang',
      startDate: '2999-01-01',
      endDate: '2999-01-03',
      numberOfSlots: 2,
      totalPrice: '5000000.00',
      status: BookingStatus.APPROVED,
    });
  });

  it('does not send an email when the booking no longer exists', async () => {
    bookings.findOne!.mockResolvedValue(null);

    await processor.processBookingDecision(job);

    expect(mailService.sendBookingDecision).not.toHaveBeenCalled();
  });

  it('lets SMTP errors escape so Bull can retry the job', async () => {
    bookings.findOne!.mockResolvedValue({
      id: 10,
      status: BookingStatus.REJECTED,
      numberOfSlots: 1,
      totalPrice: '2500000.00',
      user: { email: 'user@example.com', fullName: 'Nguyen Van A' },
      tourTime: {
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        tour: { title: 'Da Nang' },
      },
    } as BookingEntity);
    mailService.sendBookingDecision.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(processor.processBookingDecision(job)).rejects.toThrow(
      'SMTP unavailable',
    );
  });
});
