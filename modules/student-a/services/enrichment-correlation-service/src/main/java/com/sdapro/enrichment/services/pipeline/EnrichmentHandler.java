package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.commons.EnrichmentStatus;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;

/**
 * // PATTERN: Chain of Responsibility (Abstract Handler)
 * // RATIONALE: The alert enrichment pipeline consists of independent processing stages
 * //            (deduplication, GeoIP, threat intel, asset context, classification).
 * //            Chain of Responsibility decouples these stages, allowing dynamic
 * //            pipeline configuration — handlers can be added, removed, or reordered
 * //            without modifying other handlers.
 *
 * Abstract base class for enrichment handlers. Each handler:
 * 1. Processes the alert (doEnrich)
 * 2. Optionally passes it to the next handler in the chain
 *
 * The chain can be short-circuited (e.g., dedup stops processing for duplicates).
 */
public abstract class EnrichmentHandler {

    private EnrichmentHandler nextHandler;

    /**
     * Set the next handler in the chain (fluent API).
     * @return the next handler (for chaining calls)
     */
    public EnrichmentHandler setNext(EnrichmentHandler handler) {
        this.nextHandler = handler;
        return handler;
    }

    /**
     * Process the alert and pass to next handler if appropriate.
     * This is the template method that drives the chain.
     */
    public EnrichmentResult handle(CanonicalAlert alert, EnrichmentResult result) {
        EnrichmentResult enriched = doEnrich(alert, result);

        // If enrichment failed critically or was skipped, stop chain
        if (enriched.getStatus() == EnrichmentStatus.DUPLICATE_SKIPPED ||
            enriched.getStatus() == EnrichmentStatus.FAILED_STOP) {
            return enriched;
        }

        // Pass to next handler if one exists
        if (nextHandler != null) {
            return nextHandler.handle(alert, enriched);
        }

        // End of chain — mark as complete
        enriched.setStatus(EnrichmentStatus.COMPLETE);
        return enriched;
    }

    /**
     * Abstract enrichment logic — each concrete handler implements this.
     *
     * @param alert  the alert being enriched
     * @param result the accumulated enrichment result
     * @return the updated enrichment result
     */
    protected abstract EnrichmentResult doEnrich(CanonicalAlert alert, EnrichmentResult result);

    /**
     * Return the name of this handler (for logging and chain summary).
     */
    public abstract String getHandlerName();
}
