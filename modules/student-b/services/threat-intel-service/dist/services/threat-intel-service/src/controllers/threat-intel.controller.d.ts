import { ThreatIntelService } from '../services/threat-intel.service';
import { CheckReputationDto } from '../dto/check-reputation.dto';
import { BulkCheckReputationDto } from '../dto/bulk-check-reputation.dto';
import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';
export declare class ThreatIntelController {
    private readonly threatIntelService;
    private readonly logger;
    constructor(threatIntelService: ThreatIntelService);
    checkReputation(dto: CheckReputationDto): Promise<import("@shared/contracts/interfaces").ReputationResult>;
    bulkCheckReputation(dto: BulkCheckReputationDto): Promise<import("@shared/contracts/interfaces").ReputationResult[]>;
    getIndicatorHistory(indicator: string, source?: ThreatIntelSource): Promise<import("../domain/entities/threat-indicator.entity").ThreatIndicatorEntity | null>;
    getMaliciousIndicators(limit?: number): Promise<import("../domain/entities/threat-indicator.entity").ThreatIndicatorEntity[]>;
    getStats(): Promise<{
        verdictCounts: Record<string, number>;
        cacheStats: {
            size: number;
            memoryUsage: string;
        };
    }>;
    invalidateCache(indicator: string, indicatorType: IndicatorType): Promise<void>;
}
