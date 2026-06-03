// services/notification-service/src/services/channels/slack.notifier.ts
// PATTERN: Abstract Factory (Concrete Product)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Notifier } from './notifier.interface';
import { NotificationChannel } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class SlackNotifier implements Notifier {
  private readonly logger = new Logger(SlackNotifier.name);
  private readonly botToken: string;
  private readonly defaultChannel: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.botToken = this.config.get('SLACK_BOT_TOKEN', '');
    this.defaultChannel = this.config.get('SLACK_DEFAULT_CHANNEL', '#soc-alerts');
  }

  getChannel(): NotificationChannel { return NotificationChannel.SLACK; }
  isAvailable(): boolean { return Boolean(this.botToken); }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const notificationId = uuidv4();
    const channel = payload.recipient || this.defaultChannel;
    this.logger.log(`[SlackNotifier] Posting to ${channel}`);

    try {
      if (!this.botToken) {
        // Dev mode — simulate success
        await new Promise((r) => setTimeout(r, 20));
        return {
          notificationId, channel: NotificationChannel.SLACK, success: true,
          messageId: `sim-${uuidv4().slice(0, 8)}`, sentAt: new Date().toISOString(),
        };
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel,
            text: payload.subject ? `*${payload.subject}*\n${payload.body}` : payload.body,
            unfurl_links: false,
          },
          { headers: { Authorization: `Bearer ${this.botToken}`, 'Content-Type': 'application/json' } },
        ),
      );

      const data = response.data as { ok: boolean; ts: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Slack API returned ok=false');

      this.logger.log(`[SlackNotifier] Sent — ts: ${data.ts}`);
      return {
        notificationId, channel: NotificationChannel.SLACK, success: true,
        messageId: data.ts, sentAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error(`[SlackNotifier] Failed: ${(err as Error).message}`);
      return { notificationId, channel: NotificationChannel.SLACK, success: false, error: (err as Error).message };
    }
  }
}
