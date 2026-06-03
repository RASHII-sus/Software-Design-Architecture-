import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
export declare class ThreatIntelHandler extends EnrichmentHandler {
    private readonly httpService;
    private readonly config;
    private readonly threatIntelServiceUrl;
    private readonly apiKey;
    constructor(httpService: HttpService, config: ConfigService);
    getHandlerName(): string;
    protected doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult>;
    private queryThreatIntelService;
    private resolveIndicatorType;
}
