import { ThreatIntelProvider } from '../adapter/threat-intel-provider.interface';
import { ThreatIntelCacheService } from '../threat-intel-cache.service';
import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';
export declare class CachingProxy implements ThreatIntelProvider {
    private readonly realProvider;
    private readonly cacheService;
    private readonly logger;
    constructor(realProvider: ThreatIntelProvider, cacheService: ThreatIntelCacheService);
    getProviderName(): string;
    supports(type: IndicatorType): boolean;
    checkReputation(indicator: string, type: IndicatorType): Promise<ReputationResult>;
}
