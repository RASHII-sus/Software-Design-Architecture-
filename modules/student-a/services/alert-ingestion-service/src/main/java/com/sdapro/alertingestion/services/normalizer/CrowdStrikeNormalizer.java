package com.sdapro.alertingestion.services.normalizer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;
import org.springframework.stereotype.Component;

/**
 * // PATTERN: Factory Method (Concrete Product)
 * // RATIONALE: CrowdStrike EDR produces detection events in its own schema.
 * //            This normalizer maps CrowdStrike-specific fields to the canonical model.
 *
 * Normalizer for CrowdStrike EDR detection payloads.
 */
@Component
public class CrowdStrikeNormalizer implements AlertNormalizer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public CanonicalAlert normalize(String rawPayload) {
        CanonicalAlert alert = new CanonicalAlert();
        alert.setSourceType(AlertSourceType.CROWDSTRIKE);

        try {
            JsonNode root = objectMapper.readTree(rawPayload);

            alert.setTitle(getTextOrDefault(root, "detect_name", "CrowdStrike Detection"));
            alert.setDescription(getTextOrDefault(root, "detect_description", "Detection from CrowdStrike EDR"));
            alert.setSourceId(getTextOrDefault(root, "detect_id", ""));
            alert.setSourceIp(getTextOrDefault(root, "device_external_ip",
                              getTextOrDefault(root, "local_ip", "")));
            alert.setDestinationIp(getTextOrDefault(root, "target_ip", ""));
            alert.setUserName(getTextOrDefault(root, "user_name", ""));
            alert.setHostName(getTextOrDefault(root, "hostname",
                              getTextOrDefault(root, "computer_name", "")));
            alert.setAttackCategory(getTextOrDefault(root, "tactic",
                                    getTextOrDefault(root, "technique", "unknown")));

            // Map CrowdStrike severity (1-5 scale)
            alert.setSeverity(mapCrowdStrikeSeverity(root));

        } catch (Exception e) {
            alert.setTitle("CrowdStrike Detection (parse error)");
            alert.setDescription("Failed to parse CrowdStrike payload: " + e.getMessage());
            alert.setSeverity(Severity.MEDIUM);
        }

        return alert;
    }

    @Override
    public boolean supports(AlertSourceType sourceType) {
        return sourceType == AlertSourceType.CROWDSTRIKE;
    }

    private Severity mapCrowdStrikeSeverity(JsonNode node) {
        if (node.has("severity")) {
            int sev = node.get("severity").asInt(2);
            if (sev >= 5) return Severity.CRITICAL;
            if (sev >= 4) return Severity.HIGH;
            if (sev >= 3) return Severity.MEDIUM;
            return Severity.LOW;
        }
        if (node.has("max_severity_displayname")) {
            String display = node.get("max_severity_displayname").asText().toLowerCase();
            return switch (display) {
                case "critical" -> Severity.CRITICAL;
                case "high" -> Severity.HIGH;
                case "medium" -> Severity.MEDIUM;
                default -> Severity.LOW;
            };
        }
        return Severity.MEDIUM;
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        return node.has(field) ? node.get(field).asText() : defaultValue;
    }
}
