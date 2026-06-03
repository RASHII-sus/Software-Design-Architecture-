import { NotificationFactory } from './factory/notification.factory.interface';
import { NotificationRecordRepository } from '../domain/repositories/notification-record.repository';
import { NotificationChannel } from '../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../shared/contracts/interfaces';
export declare const NOTIFICATION_FACTORY = "NOTIFICATION_FACTORY";
export interface DispatchResult {
    results: DeliveryResult[];
    allSuccessful: boolean;
    failedChannels: NotificationChannel[];
}
export declare class NotificationDispatchService {
    private readonly factory;
    private readonly recordRepository;
    private readonly logger;
    constructor(factory: NotificationFactory, recordRepository: NotificationRecordRepository);
    dispatch(payload: NotificationPayload): Promise<DeliveryResult>;
    dispatchMultiple(payloads: NotificationPayload[]): Promise<DispatchResult>;
    sendIncidentAlert(incidentId: string, severity: string, description: string): Promise<DispatchResult>;
    getFactoryTier(): string;
    getStats(): Promise<Record<string, number>>;
    private resolveNotifier;
    private getDefaultRecipient;
}
