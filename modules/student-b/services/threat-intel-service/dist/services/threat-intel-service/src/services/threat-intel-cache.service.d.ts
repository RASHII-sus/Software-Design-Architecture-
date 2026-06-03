import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IndicatorType } from '../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../shared/contracts/interfaces';
export declare class ThreatIntelCacheService {
    private readonly redis;
    private readonly config;
    private readonly logger;
    private readonly defaultTtlSeconds;
    constructor(redis: Redis, config: ConfigService);
    buildCacheKey(indicator: string, type: IndicatorType, source?: string): string;
    get(indicator: string, type: IndicatorType, source?: string): Promise<ReputationResult | null>;
    set(result: ReputationResult, ttlSeconds?: number): Promise<void>;
    invalidate(indicator: string, type: IndicatorType): Promise<void>;
    getCacheStats(): Promise<{
        size: number;
        memoryUsage: string;
    }>;
    private resolveTtlFromResult;
}
