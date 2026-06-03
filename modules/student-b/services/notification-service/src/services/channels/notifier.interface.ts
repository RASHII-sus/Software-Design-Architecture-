// services/notification-service/src/services/channels/notifier.interface.ts
// PATTERN: Abstract Factory — product interface

import { NotificationChannel, NotificationStatus } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';

export interface Notifier {
  send(payload: NotificationPayload): Promise<DeliveryResult>;
  getChannel(): NotificationChannel;
  isAvailable(): boolean;
}
