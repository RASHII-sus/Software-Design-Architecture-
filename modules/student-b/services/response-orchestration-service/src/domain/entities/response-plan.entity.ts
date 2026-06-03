// services/response-orchestration-service/src/domain/entities/response-plan.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ResponsePlanStatus } from '../../../../../shared/contracts/enums';
import { ResponseActionEntity } from './response-action.entity';

@Entity('response_plans')
export class ResponsePlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'incident_id' })
  incidentId: string;

  @Column({ type: 'varchar', length: 128, name: 'strategy_name' })
  strategyName: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: ResponsePlanStatus.PENDING,
  })
  status: ResponsePlanStatus;

  @Column({ type: 'jsonb', default: '{}' })
  context: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @OneToMany(() => ResponseActionEntity, (action) => action.responsePlan, {
    cascade: true,
    eager: true,
  })
  actions: ResponseActionEntity[];
}
