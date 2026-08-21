import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('MailService', () => {
  const sendMail = jest.fn();
  const translations: Record<string, string> = {
    'mail.bookingDecision.approved.subject':
      '[Tour Booking] Booking request #{bookingId} has been approved',
    'mail.bookingDecision.approved.message':
      'Your booking request #{bookingId} has been approved.',
    'mail.bookingDecision.rejected.subject':
      '[Tour Booking] Booking request #{bookingId} has been rejected',
    'mail.bookingDecision.rejected.message':
      'Your booking request #{bookingId} has been rejected.',
    'mail.bookingDecision.greeting': 'Hello {customerName},',
    'mail.bookingDecision.tour': 'Tour: {tourName}',
    'mail.bookingDecision.travelDates': 'Travel dates: {startDate} - {endDate}',
    'mail.bookingDecision.numberOfSlots': 'Number of slots: {numberOfSlots}',
    'mail.bookingDecision.totalPrice': 'Total price: {totalPrice}',
    'mail.bookingDecision.thankYou': 'Thank you for using our service.',
  };

  const createI18n = () => ({
    t: jest.fn((key: string, options?: { args?: Record<string, unknown> }) =>
      Object.entries(options?.args ?? {}).reduce(
        (message, [name, value]) => message.replace(`{${name}}`, String(value)),
        translations[key] ?? key,
      ),
    ),
  });

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
      const i18n = createI18n();
      const service = new MailService(
        config as unknown as ConfigService,
        i18n as unknown as I18nService,
      );

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
      expect(i18n.t).toHaveBeenCalledWith(
        expect.stringContaining(`bookingDecision.${status}`),
        expect.objectContaining({ lang: 'en' }),
      );
    },
  );

  it('uses the recipient language when one is provided', async () => {
    const config = { get: jest.fn(() => undefined) };
    const i18n = createI18n();
    const service = new MailService(
      config as unknown as ConfigService,
      i18n as unknown as I18nService,
    );

    await service.sendBookingDecision({
      to: 'user@example.com',
      customerName: 'Nguyen Van A',
      bookingId: 10,
      tourName: 'Da Nang',
      startDate: '2999-01-01',
      endDate: '2999-01-03',
      numberOfSlots: 2,
      totalPrice: '5000000.00',
      status: BookingStatus.APPROVED,
      language: 'vi',
    });

    expect(i18n.t).toHaveBeenCalledWith(expect.any(String), {
      lang: 'vi',
      args: expect.anything(),
    });
  });
});
