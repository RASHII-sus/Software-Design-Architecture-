import { ConfigService } from '@nestjs/config';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
export declare class ClassificationHandler extends EnrichmentHandler {
    private readonly config;
    private readonly defaultSeverity;
    private readonly rules;
    constructor(config: ConfigService);
    getHandlerName(): string;
    protected doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult>;
    private classifyAlert;
}
