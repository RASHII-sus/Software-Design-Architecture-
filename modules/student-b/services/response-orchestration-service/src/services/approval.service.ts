// services/response-orchestration-service/src/services/approval.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRequestEntity } from '../domain/entities/approval-request.entity';
import { ResponseActionRepository } from '../domain/repositories/response-action.repository';
import { ResponseActionStatus } from '../../../../shared/contracts/enums';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @InjectRepository(ApprovalRequestEntity)
    private readonly approvalRepo: Repository<ApprovalRequestEntity>,
    private readonly actionRepository: ResponseActionRepository,
  ) {}

  async requestApproval(responseActionId: string, requestedBy?: string): Promise<ApprovalRequestEntity> {
    const existing = await this.approvalRepo.findOne({ where: { responseActionId } });
    if (existing && existing.status === 'PENDING') {
      return existing;
    }

    const entity = this.approvalRepo.create({
      responseActionId,
      requestedBy: requestedBy ?? null,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    return this.approvalRepo.save(entity);
  }

  async approve(approvalId: string, decidedBy: string, reason?: string): Promise<ApprovalRequestEntity> {
    const approval = await this.approvalRepo.findOne({ where: { id: approvalId } });
    if (!approval) {
      throw new NotFoundException(`Approval request ${approvalId} not found`);
    }

    approval.status = 'APPROVED';
    approval.decidedBy = decidedBy;
    approval.decidedAt = new Date();
    approval.reason = reason ?? null;

    const saved = await this.approvalRepo.save(approval);

    await this.actionRepository.updateStatus(approval.responseActionId, ResponseActionStatus.APPROVED, {
      approvedBy: decidedBy,
      approvedAt: new Date(),
    });

    this.logger.log(`[ApprovalService] Approved action ${approval.responseActionId} by ${decidedBy}`);
    return saved;
  }

  async reject(approvalId: string, decidedBy: string, reason: string): Promise<ApprovalRequestEntity> {
    const approval = await this.approvalRepo.findOne({ where: { id: approvalId } });
    if (!approval) {
      throw new NotFoundException(`Approval request ${approvalId} not found`);
    }

    approval.status = 'REJECTED';
    approval.decidedBy = decidedBy;
    approval.decidedAt = new Date();
    approval.reason = reason;

    return this.approvalRepo.save(approval);
  }

  async getPendingApprovals(): Promise<ApprovalRequestEntity[]> {
    return this.approvalRepo.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
    });
  }
}
