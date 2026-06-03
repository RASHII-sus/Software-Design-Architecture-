package com.sdapro.enrichment.services.strategy;

import com.sdapro.shared.contracts.CanonicalAlert;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Selects the most appropriate correlation strategy based on alert characteristics.
 */
@Component
public class CorrelationStrategySelector {

    private final PatternMatchingCorrelation patternMatching;
    private final ThresholdCorrelation threshold;
    private final TimeWindowCorrelation timeWindow;

    public CorrelationStrategySelector(PatternMatchingCorrelation patternMatching,
                                       ThresholdCorrelation threshold,
                                       TimeWindowCorrelation timeWindow) {
        this.patternMatching = patternMatching;
        this.threshold = threshold;
        this.timeWindow = timeWindow;
    }

    /**
     * Select the best correlation strategy based on alert characteristics.
     *
     * Selection logic:
     * - Multiple attack categories → PatternMatching (detect kill-chain)
     * - High volume (10+ alerts) → Threshold (severity-based)
     * - Default → TimeWindow (source IP clustering)
     */
    public CorrelationStrategy selectStrategy(List<CanonicalAlert> alerts) {
        // Check if alerts have diverse attack categories (potential kill-chain)
        Set<String> categories = alerts.stream()
            .map(CanonicalAlert::getAttackCategory)
            .filter(c -> c != null && !c.isEmpty())
            .collect(Collectors.toSet());

        if (categories.size() >= 2) {
            return patternMatching;
        }

        // High volume → threshold
        if (alerts.size() >= 10) {
            return threshold;
        }

        // Default → time window
        return timeWindow;
    }
}
