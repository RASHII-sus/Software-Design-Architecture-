// services/notification-service/src/services/factory/basic-notification.factory.ts
// PATTERN: Abstract Factory (Concrete Factory — Basic tier)
// Produces only the EmailNotifier. Slack and PagerDuty return a no-op stub.
// Used when NOTIFICATION_TIER=BASIC.

import { Injectable, Logger } from '@nestjs/common';
import { NotificationFactory } from './notification.factory.interface';
import { Notifier } from '../channels/notifier.interface';
import { EmailNotifier } from '../channels/email.notifier';
import { NotificationChannel } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';
import { v4 as uuidv4 } from 'uuid';

// No-op stub notifier for channels unavailable in Basic tier
class UnavailableNotifier implements Notifier {
  private readonly logger = new Logger('UnavailableNotifier');
  constructor(private readonly channel: NotificationChannel) {}

  getChannel(): NotificationChannel { return this.channel; }
  isAvailable(): boolean { return false; }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    this.logger.warn(
      `[BasicTier] ${this.channel} notifier is not available in the Basic tier. ` +
        `Upgrade to Enterprise to enable this channel.`,
    );
    return {
      notificationId: uuidv4(),
      channel: this.channel,
      success: false,
      error: `${this.channel} is not available in the Basic notification tier`,
    };
  }
}

@Injectable()
export class BasicNotificationFactory implements NotificationFactory {
  private readonly slackStub = new UnavailableNotifier(NotificationChannel.SLACK);
  private readonly pagerDutyStub = new UnavailableNotifier(NotificationChannel.PAGERDUTY);

  constructor(private readonly emailNotifier: EmailNotifier) {}

  getTierName(): string { return 'BASIC'; }

  createEmailNotifier(): Notifier { return this.emailNotifier; }
  createSlackNotifier(): Notifier { return this.slackStub; }
  createPagerDutyNotifier(): Notifier { return this.pagerDutyStub; }

  getAvailableNotifiers(): Notifier[] {
    return [this.emailNotifier];
  }
}
