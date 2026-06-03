// services/notification-service/src/services/factory/notification.factory.interface.ts
// PATTERN: Abstract Factory — factory interface

import { Notifier } from '../channels/notifier.interface';

export interface NotificationFactory {
  createEmailNotifier(): Notifier;
  createSlackNotifier(): Notifier;
  createPagerDutyNotifier(): Notifier;
  getAvailableNotifiers(): Notifier[];
  getTierName(): string;
}
