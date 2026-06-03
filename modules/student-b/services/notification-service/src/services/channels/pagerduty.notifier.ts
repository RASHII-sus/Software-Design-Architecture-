// services/notification-service/src/services/channels/pagerduty.notifier.ts
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
export class PagerDutyNotifier implements Notifier {
  private readonly logger = new Logger(PagerDutyNotifier.name);
  private readonly apiKey: string;
  private readonly serviceKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get('PAGERDUTY_API_KEY', '');
    this.serviceKey = this.config.get('PAGERDUTY_SERVICE_KEY', '');
  }

  getChannel(): NotificationChannel { return NotificationChannel.PAGERDUTY; }
  isAvailable(): boolean { return Boolean(this.apiKey && this.serviceKey); }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const notificationId = uuidv4();
    const dedupKey = `sda-pro-${uuidv4().slice(0, 8)}`;
    this.logger.log(`[PagerDutyNotifier] Creating incident for ${payload.recipient}`);

    try {
      if (!this.serviceKey) {
        await new Promise((r) => setTimeout(r, 25));
        return {
          notificationId, channel: NotificationChannel.PAGERDUTY, success: true,
          messageId: `pd-sim-${dedupKey}`, sentAt: new Date().toISOString(),
        };
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://events.pagerduty.com/v2/enqueue',
          {
            routing_key: this.serviceKey,
            event_action: 'trigger',
            dedup_key: dedupKey,
            payload: {
              summary: payload.subject ?? payload.body.slice(0, 100),
              source: 'SDA-Pro',
              severity: payload.priority === 'HIGH' ? 'critical' : 'warning',
              custom_details: { body: payload.body, metadata: payload.metadata },
            },
          },
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );

      const data = response.data as { status: string; dedup_key: string };
      this.logger.log(`[PagerDutyNotifier] Incident created — dedup_key: ${data.dedup_key}`);
      return {
        notificationId, channel: NotificationChannel.PAGERDUTY, success: true,
        messageId: data.dedup_key, sentAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error(`[PagerDutyNotifier] Failed: ${(err as Error).message}`);
      return { notificationId, channel: NotificationChannel.PAGERDUTY, success: false, error: (err as Error).message };
    }
  }
}
