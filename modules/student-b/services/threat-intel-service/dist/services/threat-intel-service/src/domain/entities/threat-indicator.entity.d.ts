import { IndicatorType, Verdict, ThreatIntelSource } from '../../../../../shared/contracts/enums';
export declare class ThreatIndicatorEntity {
    id: string;
    indicator: string;
    indicatorType: IndicatorType;
    verdict: Verdict;
    confidenceScore: number;
    reputationScore: number;
    source: ThreatIntelSource;
    rawResponse: Record<string, unknown> | null;
    tags: string[];
    firstSeen: Date;
    lastSeen: Date;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
