import { ConfigService } from '@nestjs/config';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
export declare class DeduplicationHandler extends EnrichmentHandler {
    private readonly config;
    private readonly windowSeconds;
    constructor(config: ConfigService);
    getHandlerName(): string;
    protected doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult>;
    private buildDedupKey;
    static clearCache(): void;
    static getCacheSize(): number;
}
