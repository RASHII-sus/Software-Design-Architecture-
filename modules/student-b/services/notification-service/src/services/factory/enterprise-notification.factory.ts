// services/notification-service/src/services/factory/enterprise-notification.factory.ts
// PATTERN: Abstract Factory (Concrete Factory — Enterprise tier)
// Produces all three notifiers: Email + Slack + PagerDuty.
// Used when NOTIFICATION_TIER=ENTERPRISE.

import { Injectable } from '@nestjs/common';
import { NotificationFactory } from './notification.factory.interface';
import { Notifier } from '../channels/notifier.interface';
import { EmailNotifier } from '../channels/email.notifier';
import { SlackNotifier } from '../channels/slack.notifier';
import { PagerDutyNotifier } from '../channels/pagerduty.notifier';

@Injectable()
export class EnterpriseNotificationFactory implements NotificationFactory {
  constructor(
    private readonly emailNotifier: EmailNotifier,
    private readonly slackNotifier: SlackNotifier,
    private readonly pagerDutyNotifier: PagerDutyNotifier,
  ) {}

  getTierName(): string { return 'ENTERPRISE'; }

  createEmailNotifier(): Notifier { return this.emailNotifier; }
  createSlackNotifier(): Notifier { return this.slackNotifier; }
  createPagerDutyNotifier(): Notifier { return this.pagerDutyNotifier; }

  getAvailableNotifiers(): Notifier[] {
    return [this.emailNotifier, this.slackNotifier, this.pagerDutyNotifier];
  }
}
