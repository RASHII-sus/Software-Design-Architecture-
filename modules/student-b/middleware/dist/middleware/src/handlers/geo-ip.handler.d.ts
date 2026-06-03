import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
export declare class GeoIPHandler extends EnrichmentHandler {
    private readonly httpService;
    private readonly config;
    private readonly threatIntelUrl;
    constructor(httpService: HttpService, config: ConfigService);
    getHandlerName(): string;
    protected doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult>;
    private lookupGeoIP;
    private isPrivateIp;
    private checkMaliciousRange;
}
