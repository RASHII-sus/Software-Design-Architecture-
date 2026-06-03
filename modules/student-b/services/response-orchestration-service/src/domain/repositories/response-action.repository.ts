// services/response-orchestration-service/src/domain/repositories/response-action.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseActionEntity } from '../entities/response-action.entity';
import { ResponseActionStatus } from '../../../../../shared/contracts/enums';

@Injectable()
export class ResponseActionRepository {
  constructor(
    @InjectRepository(ResponseActionEntity)
    private readonly repo: Repository<ResponseActionEntity>,
  ) {}

  async create(data: Partial<ResponseActionEntity>): Promise<ResponseActionEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<ResponseActionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  // FIXED: Use 'any' to bypass TypeORM's strict partial typing
  async updateStatus(
    id: string,
    status: ResponseActionStatus,
    extras?: Partial<ResponseActionEntity>,
  ): Promise<void> {
    await this.repo.update(id, { status, ...extras } as any);
  }

  async markExecuting(id: string): Promise<void> {
    await this.repo.update(id, {
      status: ResponseActionStatus.EXECUTING,
      executedAt: new Date(),
    } as any);
  }

  async markCompleted(
    id: string,
    success: boolean,
    outcome: Record<string, unknown>,
    rollbackContext?: Record<string, unknown>,
  ): Promise<void> {
    await this.repo.update(id, {
      status: success ? ResponseActionStatus.SUCCESS : ResponseActionStatus.FAILED,
      outcome,
      rollbackContext: rollbackContext ?? null,
      completedAt: new Date(),
    } as any);
  }

  async findByPlanId(responsePlanId: string): Promise<ResponseActionEntity[]> {
    return this.repo.find({ where: { responsePlanId }, order: { createdAt: 'ASC' } });
  }

  async findPendingApprovals(): Promise<ResponseActionEntity[]> {
    return this.repo.find({
      where: { status: ResponseActionStatus.PENDING, requiresApproval: true },
      order: { createdAt: 'ASC' },
    });
  }
}