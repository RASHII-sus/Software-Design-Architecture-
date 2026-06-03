// services/threat-intel-service/src/domain/repositories/threat-indicator.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ThreatIndicatorEntity } from '../entities/threat-indicator.entity';
import { IndicatorType, Verdict, ThreatIntelSource } from '../../../../../shared/contracts/enums';

export interface UpsertThreatIndicatorDto {
  indicator: string;
  indicatorType: IndicatorType;
  verdict: Verdict;
  confidenceScore: number;
  reputationScore: number;
  source: ThreatIntelSource;
  rawResponse?: Record<string, unknown>;
  tags?: string[];
  expiresAt?: Date;
}

@Injectable()
export class ThreatIndicatorRepository {
  constructor(
    @InjectRepository(ThreatIndicatorEntity)
    private readonly repo: Repository<ThreatIndicatorEntity>,
  ) {}

  async findByIndicator(
    indicator: string,
    source?: ThreatIntelSource,
  ): Promise<ThreatIndicatorEntity | null> {
    const query = this.repo.createQueryBuilder('ti')
      .where('ti.indicator = :indicator', { indicator });

    if (source) {
      query.andWhere('ti.source = :source', { source });
    }

    return query.orderBy('ti.last_seen', 'DESC').getOne();
  }

  async findAllByIndicatorType(
    indicatorType: IndicatorType,
    limit = 100,
  ): Promise<ThreatIndicatorEntity[]> {
    return this.repo.find({
      where: { indicatorType },
      order: { lastSeen: 'DESC' },
      take: limit,
    });
  }

  async findMaliciousIndicators(limit = 50): Promise<ThreatIndicatorEntity[]> {
    return this.repo.find({
      where: { verdict: Verdict.MALICIOUS },
      order: { reputationScore: 'DESC' },
      take: limit,
    });
  }

  async upsert(dto: UpsertThreatIndicatorDto): Promise<ThreatIndicatorEntity> {
    const existing = await this.findByIndicator(dto.indicator, dto.source);

    if (existing) {
      existing.verdict = dto.verdict;
      existing.confidenceScore = dto.confidenceScore;
      existing.reputationScore = dto.reputationScore;
      existing.rawResponse = dto.rawResponse ?? null;
      existing.tags = dto.tags ?? [];
      existing.lastSeen = new Date();
      existing.expiresAt = dto.expiresAt ?? null;
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      ...dto,
      rawResponse: dto.rawResponse ?? null,
      tags: dto.tags ?? [],
      firstSeen: new Date(),
      lastSeen: new Date(),
      expiresAt: dto.expiresAt ?? null,
    });
    return this.repo.save(entity);
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expires_at IS NOT NULL AND expires_at < NOW()')
      .execute();
    return result.affected ?? 0;
  }

  async countByVerdict(): Promise<Record<string, number>> {
    const rows: { verdict: string; count: string }[] = await this.repo
      .createQueryBuilder('ti')
      .select('ti.verdict', 'verdict')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ti.verdict')
      .getRawMany();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.verdict] = parseInt(row.count, 10);
      return acc;
    }, {});
  }
}
