import { PipelineResult } from '../handlers/enrichment-handler.abstract';
import { DeduplicationHandler } from '../handlers/deduplication.handler';
import { GeoIPHandler } from '../handlers/geo-ip.handler';
import { ThreatIntelHandler } from '../handlers/threat-intel.handler';
import { ClassificationHandler } from '../handlers/classification.handler';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
export declare class PipelineAssembler {
    private readonly deduplicationHandler;
    private readonly geoIPHandler;
    private readonly threatIntelHandler;
    private readonly classificationHandler;
    private readonly logger;
    private readonly head;
    constructor(deduplicationHandler: DeduplicationHandler, geoIPHandler: GeoIPHandler, threatIntelHandler: ThreatIntelHandler, classificationHandler: ClassificationHandler);
    process(alert: CanonicalAlert): Promise<PipelineResult>;
    getChainDescription(): string[];
}
