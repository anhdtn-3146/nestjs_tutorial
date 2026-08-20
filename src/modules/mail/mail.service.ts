import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { BookingStatus } from 'src/database/entities/booking.entity';

export interface BookingDecisionMail {
  to: string;
  customerName: string;
  bookingId: number;
  tourName: string;
  startDate: string;
  endDate: string;
  numberOfSlots: number;
  totalPrice: string;
  status: BookingStatus.APPROVED | BookingStatus.REJECTED;
}

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') ?? '127.0.0.1',
      port: Number(this.configService.get<string>('MAIL_PORT') ?? 1025),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      ...(user && password ? { auth: { user, pass: password } } : {}),
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
    });
    this.from =
      this.configService.get<string>('MAIL_FROM') ??
      'Tour Booking <no-reply@tour.local>';
  }

  async sendBookingDecision(mail: BookingDecisionMail): Promise<void> {
    const decision =
      mail.status === BookingStatus.APPROVED
        ? 'has been approved'
        : 'has been rejected';

    await this.transporter.sendMail({
      from: this.from,
      to: mail.to,
      subject: `[Tour Booking] Booking request #${mail.bookingId} ${decision}`,
      text: [
        `Hello ${mail.customerName},`,
        '',
        `Your booking request #${mail.bookingId} ${decision}.`,
        `Tour: ${mail.tourName}`,
        `Travel dates: ${mail.startDate} - ${mail.endDate}`,
        `Number of slots: ${mail.numberOfSlots}`,
        `Total price: ${mail.totalPrice}`,
        '',
        'Thank you for using our service.',
      ].join('\n'),
    });
  }
}
