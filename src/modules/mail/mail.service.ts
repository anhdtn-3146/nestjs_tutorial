import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { bookingDecisionTemplate } from './templates/booking-decision.template';

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
  language?: string;
}

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly defaultLanguage: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
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
    this.defaultLanguage =
      this.configService.get<string>('MAIL_LANGUAGE') ?? 'en';
  }

  async sendBookingDecision(mail: BookingDecisionMail): Promise<void> {
    const template = bookingDecisionTemplate(
      this.i18n,
      mail.language ?? this.defaultLanguage,
      mail,
    );

    await this.transporter.sendMail({
      from: this.from,
      to: mail.to,
      ...template,
    });
  }
}
