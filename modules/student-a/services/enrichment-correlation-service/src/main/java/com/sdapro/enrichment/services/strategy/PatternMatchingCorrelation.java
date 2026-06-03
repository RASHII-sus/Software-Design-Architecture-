package com.sdapro.enrichment.services.strategy;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * // PATTERN: Strategy (Concrete Strategy #1)
 * // RATIONALE: Detects multi-stage attack patterns (e.g., reconnaissance → lateral
 * //            movement → exfiltration) by analyzing the sequence of attack categories.
 *
 * Pattern matching correlation: looks for known attack kill-chain sequences.
 */
@Component
public class PatternMatchingCorrelation implements CorrelationStrategy {

    private static final List<List<String>> KNOWN_PATTERNS = List.of(
        List.of("reconnaissance", "lateral-movement", "exfiltration"),
        List.of("authentication-attack", "privilege-escalation", "data-access"),
        List.of("network-intrusion", "execution", "persistence"),
        List.of("phishing", "execution", "command-and-control")
    );

    @Override
    public CorrelationResult correlate(List<CanonicalAlert> alerts,
                                        Map<UUID, EnrichmentResult> enrichmentResults) {
        Set<String> categories = alerts.stream()
            .map(CanonicalAlert::getAttackCategory)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        for (List<String> pattern : KNOWN_PATTERNS) {
            long matchCount = pattern.stream().filter(categories::contains).count();
            double confidence = (double) matchCount / pattern.size();

            if (confidence >= 0.7) {
                CorrelationResult result = new CorrelationResult(
                    CorrelationResult.Action.CREATE_INCIDENT,
                    "pattern-match:" + String.join("→", pattern),
                    confidence
                );
                result.setSummary("Detected attack pattern: " + String.join(" → ", pattern) +
                                  " (confidence: " + String.format("%.0f%%", confidence * 100) + ")");
                return result;
            }
        }

        return new CorrelationResult(CorrelationResult.Action.NO_ACTION, "pattern-match", 0.0);
    }

    @Override
    public String getName() { return "PatternMatchingCorrelation"; }
}
