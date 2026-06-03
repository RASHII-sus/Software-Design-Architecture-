import { Repository } from 'typeorm';
import { NotificationRecordEntity } from '../entities/notification-record.entity';
import { NotificationChannel, NotificationStatus } from '../../../../../shared/contracts/enums';
export declare class NotificationRecordRepository {
    private readonly repo;
    constructor(repo: Repository<NotificationRecordEntity>);
    create(data: Partial<NotificationRecordEntity>): Promise<NotificationRecordEntity>;
    markSent(id: string, messageId?: string): Promise<void>;
    markFailed(id: string, error: string, attempts: number): Promise<void>;
    findByChannel(channel: NotificationChannel, limit?: number): Promise<NotificationRecordEntity[]>;
    findByStatus(status: NotificationStatus, limit?: number): Promise<NotificationRecordEntity[]>;
    countByStatus(): Promise<Record<string, number>>;
}
