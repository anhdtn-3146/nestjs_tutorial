import { I18nService } from 'nestjs-i18n';
import { BookingStatus } from 'src/database/entities/booking.entity';
import type { BookingDecisionMail } from '../mail.service';

export interface MailTemplate {
  subject: string;
  text: string;
}

export function bookingDecisionTemplate(
  i18n: I18nService,
  language: string,
  mail: BookingDecisionMail,
): MailTemplate {
  const decision =
    mail.status === BookingStatus.APPROVED ? 'approved' : 'rejected';
  const translate = (key: string, args?: Record<string, unknown>): string =>
    String(i18n.t(key, { lang: language, args }));

  return {
    subject: translate(`mail.bookingDecision.${decision}.subject`, {
      bookingId: mail.bookingId,
    }),
    text: [
      translate('mail.bookingDecision.greeting', {
        customerName: mail.customerName,
      }),
      '',
      translate(`mail.bookingDecision.${decision}.message`, {
        bookingId: mail.bookingId,
      }),
      translate('mail.bookingDecision.tour', { tourName: mail.tourName }),
      translate('mail.bookingDecision.travelDates', {
        startDate: mail.startDate,
        endDate: mail.endDate,
      }),
      translate('mail.bookingDecision.numberOfSlots', {
        numberOfSlots: mail.numberOfSlots,
      }),
      translate('mail.bookingDecision.totalPrice', {
        totalPrice: mail.totalPrice,
      }),
      '',
      translate('mail.bookingDecision.thankYou'),
    ].join('\n'),
  };
}
