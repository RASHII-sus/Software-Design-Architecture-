import { Repository } from 'typeorm';
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
export declare class ThreatIndicatorRepository {
    private readonly repo;
    constructor(repo: Repository<ThreatIndicatorEntity>);
    findByIndicator(indicator: string, source?: ThreatIntelSource): Promise<ThreatIndicatorEntity | null>;
    findAllByIndicatorType(indicatorType: IndicatorType, limit?: number): Promise<ThreatIndicatorEntity[]>;
    findMaliciousIndicators(limit?: number): Promise<ThreatIndicatorEntity[]>;
    upsert(dto: UpsertThreatIndicatorDto): Promise<ThreatIndicatorEntity>;
    deleteExpired(): Promise<number>;
    countByVerdict(): Promise<Record<string, number>>;
}
