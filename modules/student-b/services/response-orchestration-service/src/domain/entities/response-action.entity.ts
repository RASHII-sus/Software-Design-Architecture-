// services/response-orchestration-service/src/domain/entities/response-action.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResponseActionType, ResponseActionStatus } from '../../../../../shared/contracts/enums';
import { ResponsePlanEntity } from './response-plan.entity';

@Entity('response_actions')
export class ResponseActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'response_plan_id' })
  responsePlanId: string;

  @ManyToOne(() => ResponsePlanEntity, (plan) => plan.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_plan_id' })
  responsePlan: ResponsePlanEntity;

  @Column({ type: 'varchar', length: 64, name: 'action_type' })
  actionType: ResponseActionType;

  @Column({ type: 'jsonb', name: 'target_asset' })
  targetAsset: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 32,
    default: ResponseActionStatus.PENDING,
  })
  status: ResponseActionStatus;

  @Column({ type: 'jsonb', nullable: true })
  outcome: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'rollback_context' })
  rollbackContext: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false, name: 'requires_approval' })
  requiresApproval: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' })
  approvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'executed_at' })
  executedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
