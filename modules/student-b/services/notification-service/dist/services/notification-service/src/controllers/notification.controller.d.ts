import { NotificationDispatchService } from '../services/notification-dispatch.service';
import { NotificationChannel } from '../../../../shared/contracts/enums';
declare class DispatchNotificationDto {
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    body: string;
    metadata?: Record<string, unknown>;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}
declare class IncidentAlertDto {
    incidentId: string;
    severity: string;
    description: string;
}
export declare class NotificationController {
    private readonly dispatchService;
    private readonly logger;
    constructor(dispatchService: NotificationDispatchService);
    dispatch(dto: DispatchNotificationDto): Promise<import("@shared/contracts/interfaces").DeliveryResult>;
    sendIncidentAlert(dto: IncidentAlertDto): Promise<import("../services/notification-dispatch.service").DispatchResult>;
    getStats(): Promise<Record<string, number>>;
    getTier(): {
        tier: string;
        description: string;
    };
}
export {};
