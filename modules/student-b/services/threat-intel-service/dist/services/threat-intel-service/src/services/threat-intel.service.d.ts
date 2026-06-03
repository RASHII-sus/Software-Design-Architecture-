import { ThreatIntelProvider } from './adapter/threat-intel-provider.interface';
import { VirusTotalAdapter } from './adapter/virustotal.adapter';
import { MISPAdapter } from './adapter/misp.adapter';
import { CustomFeedAdapter } from './adapter/custom-feed.adapter';
import { ThreatIntelCacheService } from './threat-intel-cache.service';
import { ThreatIndicatorRepository } from '../domain/repositories/threat-indicator.repository';
import { ThreatIntelEventPublisher } from '../events/threat-intel-event.publisher';
import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../shared/contracts/interfaces';
import { CheckReputationDto } from '../dto/check-reputation.dto';
import { BulkCheckReputationDto } from '../dto/bulk-check-reputation.dto';
export declare class ThreatIntelService {
    private readonly defaultProvider;
    private readonly virusTotalAdapter;
    private readonly mispAdapter;
    private readonly customFeedAdapter;
    private readonly cacheService;
    private readonly indicatorRepository;
    private readonly eventPublisher;
    private readonly logger;
    private readonly providerRegistry;
    constructor(defaultProvider: ThreatIntelProvider, virusTotalAdapter: VirusTotalAdapter, mispAdapter: MISPAdapter, customFeedAdapter: CustomFeedAdapter, cacheService: ThreatIntelCacheService, indicatorRepository: ThreatIndicatorRepository, eventPublisher: ThreatIntelEventPublisher);
    checkReputation(dto: CheckReputationDto): Promise<ReputationResult>;
    bulkCheckReputation(dto: BulkCheckReputationDto): Promise<ReputationResult[]>;
    getIndicatorHistory(indicator: string, source?: ThreatIntelSource): Promise<import("../domain/entities/threat-indicator.entity").ThreatIndicatorEntity | null>;
    getMaliciousIndicators(limit?: number): Promise<import("../domain/entities/threat-indicator.entity").ThreatIndicatorEntity[]>;
    getStats(): Promise<{
        verdictCounts: Record<string, number>;
        cacheStats: {
            size: number;
            memoryUsage: string;
        };
    }>;
    invalidateCache(indicator: string, type: IndicatorType): Promise<void>;
    private resolveProviderBySource;
    private persistResult;
}
