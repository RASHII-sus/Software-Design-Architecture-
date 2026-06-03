import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Notifier } from './notifier.interface';
import { NotificationChannel } from '../../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../../shared/contracts/interfaces';
export declare class PagerDutyNotifier implements Notifier {
    private readonly httpService;
    private readonly config;
    private readonly logger;
    private readonly apiKey;
    private readonly serviceKey;
    constructor(httpService: HttpService, config: ConfigService);
    getChannel(): NotificationChannel;
    isAvailable(): boolean;
    send(payload: NotificationPayload): Promise<DeliveryResult>;
}
