// services/response-orchestration-service/src/domain/entities/approval-request.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResponseActionEntity } from './response-action.entity';

@Entity('approval_requests')
export class ApprovalRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'response_action_id' })
  responseActionId: string;

  @ManyToOne(() => ResponseActionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_action_id' })
  responseAction: ResponseActionEntity;

  @Column({ type: 'uuid', nullable: true, name: 'requested_by' })
  requestedBy: string | null;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'decided_by' })
  decidedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'decided_at' })
  decidedAt: Date | null;

  @Column({
    type: 'timestamptz',
    name: 'expires_at',
    default: () => "NOW() + INTERVAL '30 minutes'",
  })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
