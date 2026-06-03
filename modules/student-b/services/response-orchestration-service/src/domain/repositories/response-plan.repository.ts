// services/response-orchestration-service/src/domain/repositories/response-plan.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponsePlanEntity } from '../entities/response-plan.entity';
import { ResponsePlanStatus } from '../../../../../shared/contracts/enums';

@Injectable()
export class ResponsePlanRepository {
  constructor(
    @InjectRepository(ResponsePlanEntity)
    private readonly repo: Repository<ResponsePlanEntity>,
  ) {}

  async create(data: Partial<ResponsePlanEntity>): Promise<ResponsePlanEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<ResponsePlanEntity | null> {
    return this.repo.findOne({ where: { id }, relations: ['actions'] });
  }

  async findByIncidentId(incidentId: string): Promise<ResponsePlanEntity[]> {
    return this.repo.find({
      where: { incidentId },
      relations: ['actions'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    status: ResponsePlanStatus,
    completedAt?: Date,
  ): Promise<void> {
    await this.repo.update(id, {
      status,
      ...(completedAt ? { completedAt } : {}),
    });
  }

  async findActivePlans(): Promise<ResponsePlanEntity[]> {
    return this.repo.find({
      where: [
        { status: ResponsePlanStatus.PENDING },
        { status: ResponsePlanStatus.IN_PROGRESS },
      ],
      relations: ['actions'],
      order: { createdAt: 'DESC' },
    });
  }
}
