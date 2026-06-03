import { NotificationChannel, NotificationStatus } from '../../../../../shared/contracts/enums';
export declare class NotificationRecordEntity {
    id: string;
    channel: NotificationChannel;
    recipient: string;
    subject: string | null;
    body: string;
    metadata: Record<string, unknown>;
    status: NotificationStatus;
    attempts: number;
    lastError: string | null;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
