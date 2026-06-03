package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

/**
 * Assembles the enrichment pipeline by chaining all handlers in order.
 * The pipeline order is: Deduplication → GeoIP → ThreatIntel → AssetContext → Classification
 */
@Component
public class EnrichmentPipelineAssembler {

    private final DeduplicationHandler deduplicationHandler;
    private final GeoIPHandler geoIPHandler;
    private final ThreatIntelHandler threatIntelHandler;
    private final AssetContextHandler assetContextHandler;
    private final ClassificationHandler classificationHandler;

    public EnrichmentPipelineAssembler(DeduplicationHandler deduplicationHandler,
                                       GeoIPHandler geoIPHandler,
                                       ThreatIntelHandler threatIntelHandler,
                                       AssetContextHandler assetContextHandler,
                                       ClassificationHandler classificationHandler) {
        this.deduplicationHandler = deduplicationHandler;
        this.geoIPHandler = geoIPHandler;
        this.threatIntelHandler = threatIntelHandler;
        this.assetContextHandler = assetContextHandler;
        this.classificationHandler = classificationHandler;
    }

    /**
     * // PATTERN: Chain of Responsibility — assemble the handler chain
     *
     * Chains all handlers in the correct order and returns the head of the chain.
     * The chain flows: Dedup → GeoIP → ThreatIntel → AssetContext → Classification
     *
     * @return the first handler in the chain (DeduplicationHandler)
     */
    public EnrichmentHandler assemblePipeline() {
        deduplicationHandler
            .setNext(geoIPHandler)
            .setNext(threatIntelHandler)
            .setNext(assetContextHandler)
            .setNext(classificationHandler);

        return deduplicationHandler;
    }

    /**
     * Execute the full pipeline on an alert.
     */
    public EnrichmentResult executePipeline(CanonicalAlert alert) {
        EnrichmentHandler head = assemblePipeline();
        EnrichmentResult result = new EnrichmentResult(alert.getId(), null);
        return head.handle(alert, result);
    }
}
