package com.sdapro.enrichment.services.strategy;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * // PATTERN: Strategy (Strategy Interface)
 * // RATIONALE: Different correlation algorithms are appropriate for different alert
 * //            characteristics. Strategy pattern allows interchangeable algorithms
 * //            selected at runtime based on alert context, without modifying client code.
 *
 * Interface for correlation algorithms. Each strategy implements a different
 * approach to detecting related alerts that should be grouped into incidents.
 */
public interface CorrelationStrategy {

    /**
     * Correlate a batch of enriched alerts and determine if an incident should be created.
     *
     * @param alerts            the alerts to correlate
     * @param enrichmentResults enrichment data for each alert (keyed by alert ID)
     * @return the correlation result with recommended action
     */
    CorrelationResult correlate(List<CanonicalAlert> alerts,
                                Map<UUID, EnrichmentResult> enrichmentResults);

    /** Human-readable name of this strategy. */
    String getName();
}
