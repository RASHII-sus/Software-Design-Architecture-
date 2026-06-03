package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * // PATTERN: Chain of Responsibility (Concrete Handler #5)
 * // RATIONALE: Final handler — classifies the alert's severity based on accumulated
 * //            enrichment data (threat intel verdict + asset criticality).
 *
 * Rule-based severity classification handler. Determines final severity using
 * enrichment context from earlier handlers in the chain.
 */
@Component
public class ClassificationHandler extends EnrichmentHandler {

    @Override
    protected EnrichmentResult doEnrich(CanonicalAlert alert, EnrichmentResult result) {
        String verdict = extractVerdict(result.getThreatIntelData());
        String criticality = extractCriticality(result.getAssetContextData());

        String finalSeverity = classifySeverity(verdict, criticality);
        result.setClassifiedSeverity(finalSeverity);

        // Build chain summary
        String summary = String.format(
            "Dedup->GeoIP->ThreatIntel(%s)->Asset(%s)->Classification(%s)",
            verdict, criticality, finalSeverity
        );
        result.setHandlerChainSummary(summary);

        return result;
    }

    @Override
    public String getHandlerName() {
        return "ClassificationHandler";
    }

    /**
     * Rule-based severity classification matrix:
     *
     * | Threat Verdict | Asset Criticality | Final Severity |
     * |---------------|-------------------|----------------|
     * | MALICIOUS     | CRITICAL/HIGH     | CRITICAL       |
     * | MALICIOUS     | MEDIUM/LOW        | HIGH           |
     * | SUSPICIOUS    | CRITICAL/HIGH     | HIGH           |
     * | SUSPICIOUS    | MEDIUM/LOW        | MEDIUM         |
     * | CLEAN         | *                 | LOW            |
     */
    private String classifySeverity(String verdict, String criticality) {
        return switch (verdict) {
            case "MALICIOUS" -> (criticality.equals("CRITICAL") || criticality.equals("HIGH"))
                    ? "CRITICAL" : "HIGH";
            case "SUSPICIOUS" -> (criticality.equals("CRITICAL") || criticality.equals("HIGH"))
                    ? "HIGH" : "MEDIUM";
            case "CLEAN" -> "LOW";
            default -> "MEDIUM";
        };
    }

    private String extractVerdict(Map<String, Object> threatIntelData) {
        if (threatIntelData == null) return "UNKNOWN";
        Object verdict = threatIntelData.get("verdict");
        return verdict != null ? verdict.toString() : "UNKNOWN";
    }

    private String extractCriticality(Map<String, Object> assetData) {
        if (assetData == null) return "UNKNOWN";
        Object criticality = assetData.get("criticality");
        return criticality != null ? criticality.toString() : "UNKNOWN";
    }
}
