package com.sdapro.enrichment.services.strategy;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * // PATTERN: Strategy (Concrete Strategy #3)
 * // RATIONALE: Detects coordinated activity by grouping alerts from the same source IP
 * //            within a time window — indicative of an active attacker.
 *
 * Time-window correlation: groups alerts by source IP within a 10-minute window.
 */
@Component
public class TimeWindowCorrelation implements CorrelationStrategy {

    private static final Duration TIME_WINDOW = Duration.ofMinutes(10);
    private static final int CLUSTER_THRESHOLD = 3;

    @Override
    public CorrelationResult correlate(List<CanonicalAlert> alerts,
                                        Map<UUID, EnrichmentResult> enrichmentResults) {
        // Group alerts by source IP
        Map<String, List<CanonicalAlert>> bySourceIp = alerts.stream()
            .filter(a -> a.getSourceIp() != null && !a.getSourceIp().isEmpty())
            .collect(Collectors.groupingBy(CanonicalAlert::getSourceIp));

        for (Map.Entry<String, List<CanonicalAlert>> entry : bySourceIp.entrySet()) {
            List<CanonicalAlert> ipAlerts = entry.getValue();

            // Check if alerts fall within the time window
            List<CanonicalAlert> windowAlerts = filterByTimeWindow(ipAlerts);
            if (windowAlerts.size() >= CLUSTER_THRESHOLD) {
                CorrelationResult result = new CorrelationResult(
                    CorrelationResult.Action.CREATE_INCIDENT,
                    "time-window:ip=" + entry.getKey(),
                    0.85
                );
                result.setSummary(windowAlerts.size() + " alerts from IP " + entry.getKey() +
                                  " within " + TIME_WINDOW.toMinutes() + " minute window");
                return result;
            }
        }

        return new CorrelationResult(CorrelationResult.Action.NO_ACTION, "time-window", 0.0);
    }

    @Override
    public String getName() { return "TimeWindowCorrelation"; }

    private List<CanonicalAlert> filterByTimeWindow(List<CanonicalAlert> alerts) {
        if (alerts.isEmpty()) return alerts;

        alerts.sort(Comparator.comparing(CanonicalAlert::getTimestamp));
        Instant windowStart = alerts.get(alerts.size() - 1).getTimestamp().minus(TIME_WINDOW);

        return alerts.stream()
            .filter(a -> a.getTimestamp().isAfter(windowStart))
            .collect(Collectors.toList());
    }
}
