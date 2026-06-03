import { NotificationChannel } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';
export interface Notifier {
    send(payload: NotificationPayload): Promise<DeliveryResult>;
    getChannel(): NotificationChannel;
    isAvailable(): boolean;
}
