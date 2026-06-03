package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.commons.EnrichmentStatus;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * // PATTERN: Chain of Responsibility (Concrete Handler #1)
 * // RATIONALE: First handler in the pipeline — checks if this alert is a duplicate
 * //            of a recently processed alert. If duplicate, short-circuits the chain.
 *
 * Deduplication handler: prevents processing of duplicate alerts within a time window.
 * Uses an in-memory cache (replaces Redis for the demo environment).
 */
@Component
public class DeduplicationHandler extends EnrichmentHandler {

    private static final long DEDUP_WINDOW_MILLIS = 5 * 60 * 1000; // 5 minutes
    private final ConcurrentHashMap<String, Instant> alertCache = new ConcurrentHashMap<>();

    @Override
    protected EnrichmentResult doEnrich(CanonicalAlert alert, EnrichmentResult result) {
        String dedupKey = generateDedupKey(alert);

        Instant previousOccurrence = alertCache.get(dedupKey);
        if (previousOccurrence != null) {
            long ageMillis = Instant.now().toEpochMilli() - previousOccurrence.toEpochMilli();
            if (ageMillis < DEDUP_WINDOW_MILLIS) {
                // Duplicate detected — short-circuit the chain
                result.setDuplicate(true);
                result.setStatus(EnrichmentStatus.DUPLICATE_SKIPPED);
                result.setHandlerChainSummary("DeduplicationHandler: DUPLICATE (key=" + dedupKey + ")");
                return result;
            }
        }

        // Not a duplicate — update cache and continue
        alertCache.put(dedupKey, Instant.now());
        cleanExpiredEntries();
        return result;
    }

    @Override
    public String getHandlerName() {
        return "DeduplicationHandler";
    }

    private String generateDedupKey(CanonicalAlert alert) {
        return String.join("|",
            nullSafe(alert.getSourceIp()),
            nullSafe(alert.getDestinationIp()),
            nullSafe(alert.getAttackCategory()),
            nullSafe(alert.getTitle())
        );
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }

    private void cleanExpiredEntries() {
        Instant threshold = Instant.now().minusMillis(DEDUP_WINDOW_MILLIS);
        alertCache.entrySet().removeIf(entry -> entry.getValue().isBefore(threshold));
    }

    /** Clear cache (for testing). */
    public void clearCache() {
        alertCache.clear();
    }
}
