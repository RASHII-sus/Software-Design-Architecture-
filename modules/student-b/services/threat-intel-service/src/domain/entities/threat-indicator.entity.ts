// services/threat-intel-service/src/domain/entities/threat-indicator.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IndicatorType, Verdict, ThreatIntelSource } from '../../../../../shared/contracts/enums';

@Entity('threat_indicators')
@Index(['indicator'])
@Index(['indicatorType', 'verdict'])
export class ThreatIndicatorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 512 })
  indicator: string;

  @Column({ type: 'varchar', length: 64, name: 'indicator_type' })
  indicatorType: IndicatorType;

  @Column({ type: 'varchar', length: 32 })
  verdict: Verdict;

  @Column({ type: 'integer', default: 0, name: 'confidence' })
  confidenceScore: number;

  @Column({ type: 'integer', default: 0, name: 'reputation_score' })
  reputationScore: number;

  @Column({ type: 'varchar', length: 128 })
  source: ThreatIntelSource;

  @Column({ type: 'jsonb', nullable: true, name: 'raw_response' })
  rawResponse: Record<string, unknown> | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'timestamptz', name: 'first_seen', default: () => 'NOW()' })
  firstSeen: Date;

  @Column({ type: 'timestamptz', name: 'last_seen', default: () => 'NOW()' })
  lastSeen: Date;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
