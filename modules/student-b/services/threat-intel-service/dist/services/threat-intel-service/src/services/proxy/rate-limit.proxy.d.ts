import { ConfigService } from '@nestjs/config';
import { ThreatIntelProvider } from '../adapter/threat-intel-provider.interface';
import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';
export declare class RateLimitExceededException extends Error {
    readonly provider: string;
    readonly limitPerMinute: number;
    constructor(provider: string, limitPerMinute: number);
}
export declare class RateLimitProxy implements ThreatIntelProvider {
    private readonly realProvider;
    private readonly config;
    private readonly logger;
    private readonly windowMs;
    private readonly windows;
    private readonly limitPerMinute;
    constructor(realProvider: ThreatIntelProvider, config: ConfigService);
    getProviderName(): string;
    supports(type: IndicatorType): boolean;
    checkReputation(indicator: string, type: IndicatorType): Promise<ReputationResult>;
    private allowRequest;
    private getRemainingRequests;
    private resolveRateLimit;
}
