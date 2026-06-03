// services/notification-service/src/domain/repositories/notification-record.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRecordEntity } from '../entities/notification-record.entity';
import { NotificationChannel, NotificationStatus } from '../../../../../shared/contracts/enums';

@Injectable()
export class NotificationRecordRepository {
  constructor(
    @InjectRepository(NotificationRecordEntity)
    private readonly repo: Repository<NotificationRecordEntity>,
  ) {}

  async create(data: Partial<NotificationRecordEntity>): Promise<NotificationRecordEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async markSent(id: string, messageId?: string): Promise<void> {
    await this.repo.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      metadata: messageId ? { messageId } : {},
    });
  }

  async markFailed(id: string, error: string, attempts: number): Promise<void> {
    await this.repo.update(id, {
      status: attempts >= 3 ? NotificationStatus.FAILED : NotificationStatus.RETRYING,
      lastError: error,
      attempts,
    });
  }

  async findByChannel(
    channel: NotificationChannel,
    limit = 50,
  ): Promise<NotificationRecordEntity[]> {
    return this.repo.find({
      where: { channel },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByStatus(status: NotificationStatus, limit = 50): Promise<NotificationRecordEntity[]> {
    return this.repo.find({
      where: { status },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows: { status: string; count: string }[] = await this.repo
      .createQueryBuilder('n')
      .select('n.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.status')
      .getRawMany();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
  }
}
