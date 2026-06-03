// services/notification-service/src/services/channels/email.notifier.ts
// PATTERN: Abstract Factory (Concrete Product)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Notifier } from './notifier.interface';
import { NotificationChannel } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class EmailNotifier implements Notifier {
  private readonly logger = new Logger(EmailNotifier.name);
  private readonly smtpHost: string;
  private readonly smtpUser: string;

  constructor(private readonly config: ConfigService) {
    this.smtpHost = this.config.get('SMTP_HOST', '');
    this.smtpUser = this.config.get('SMTP_USER', '');
  }

  getChannel(): NotificationChannel { return NotificationChannel.EMAIL; }

  isAvailable(): boolean { return Boolean(this.smtpHost && this.smtpUser); }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const notificationId = uuidv4();
    this.logger.log(`[EmailNotifier] Sending to ${payload.recipient} — subject: ${payload.subject}`);
    try {
      // In production: use nodemailer.createTransport({ host, port, auth }).sendMail(...)
      // Simulated here for demo
      await new Promise((r) => setTimeout(r, 30));
      const messageId = `<${uuidv4()}@${this.smtpHost || 'sda-pro.local'}>`;
      this.logger.log(`[EmailNotifier] Sent — messageId: ${messageId}`);
      return {
        notificationId, channel: NotificationChannel.EMAIL, success: true,
        messageId, sentAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error(`[EmailNotifier] Failed: ${(err as Error).message}`);
      return {
        notificationId, channel: NotificationChannel.EMAIL, success: false,
        error: (err as Error).message,
      };
    }
  }
}
