import { ConfigService } from '@nestjs/config';
import { Notifier } from './notifier.interface';
import { NotificationChannel } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';
export declare class EmailNotifier implements Notifier {
    private readonly config;
    private readonly logger;
    private readonly smtpHost;
    private readonly smtpUser;
    constructor(config: ConfigService);
    getChannel(): NotificationChannel;
    isAvailable(): boolean;
    send(payload: NotificationPayload): Promise<DeliveryResult>;
}
