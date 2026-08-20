import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('MailService', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it.each([
    [BookingStatus.APPROVED, 'has been approved'],
    [BookingStatus.REJECTED, 'has been rejected'],
  ] as const)(
    'sends a %s booking decision through MailHog',
    async (status, text) => {
      const config = {
        get: jest.fn(
          (key: string) =>
            ({
              MAIL_HOST: '127.0.0.1',
              MAIL_PORT: '1025',
              MAIL_SECURE: 'false',
              MAIL_FROM: 'Tour <no-reply@tour.local>',
            })[key],
        ),
      };
      const service = new MailService(config as unknown as ConfigService);

      await service.sendBookingDecision({
        to: 'user@example.com',
        customerName: 'Nguyen Van A',
        bookingId: 10,
        tourName: 'Da Nang',
        startDate: '2999-01-01',
        endDate: '2999-01-03',
        numberOfSlots: 2,
        totalPrice: '5000000.00',
        status,
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: '127.0.0.1',
          port: 1025,
          secure: false,
        }),
      );
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Tour <no-reply@tour.local>',
          to: 'user@example.com',
          subject: expect.stringContaining(text),
          text: expect.stringContaining('Tour: Da Nang'),
        }),
      );
    },
  );
});
