package com.sdapro.enrichment.services.strategy;

import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * // PATTERN: Strategy (Concrete Strategy #2)
 * // RATIONALE: Creates incidents when the volume of high-severity alerts exceeds a threshold.
 *
 * Threshold-based correlation: triggers incident creation when critical/high alert counts
 * exceed configured thresholds.
 */
@Component
public class ThresholdCorrelation implements CorrelationStrategy {

    private static final int CRITICAL_THRESHOLD = 3;
    private static final int HIGH_THRESHOLD = 5;

    @Override
    public CorrelationResult correlate(List<CanonicalAlert> alerts,
                                        Map<UUID, EnrichmentResult> enrichmentResults) {
        long criticalCount = alerts.stream()
            .filter(a -> a.getSeverity() == Severity.CRITICAL)
            .count();
        long highCount = alerts.stream()
            .filter(a -> a.getSeverity() == Severity.HIGH)
            .count();

        if (criticalCount >= CRITICAL_THRESHOLD) {
            CorrelationResult result = new CorrelationResult(
                CorrelationResult.Action.CREATE_INCIDENT,
                "threshold:critical>=" + CRITICAL_THRESHOLD,
                0.9
            );
            result.setSummary(criticalCount + " CRITICAL alerts detected (threshold: " + CRITICAL_THRESHOLD + ")");
            return result;
        }

        if (highCount >= HIGH_THRESHOLD) {
            CorrelationResult result = new CorrelationResult(
                CorrelationResult.Action.CREATE_INCIDENT,
                "threshold:high>=" + HIGH_THRESHOLD,
                0.8
            );
            result.setSummary(highCount + " HIGH alerts detected (threshold: " + HIGH_THRESHOLD + ")");
            return result;
        }

        return new CorrelationResult(CorrelationResult.Action.NO_ACTION, "threshold", 0.0);
    }

    @Override
    public String getName() { return "ThresholdCorrelation"; }
}
