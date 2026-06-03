package com.sdapro.alertingestion.services.normalizer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;
import org.springframework.stereotype.Component;

/**
 * // PATTERN: Factory Method (Concrete Product)
 * // RATIONALE: Splunk SIEM produces alerts in its specific JSON schema.
 * //            This normalizer maps Splunk-specific fields to the canonical model.
 *
 * Normalizer for Splunk SIEM alert payloads.
 * Maps Splunk's result schema to the canonical alert format.
 */
@Component
public class SplunkNormalizer implements AlertNormalizer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public CanonicalAlert normalize(String rawPayload) {
        CanonicalAlert alert = new CanonicalAlert();
        alert.setSourceType(AlertSourceType.SPLUNK);

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            JsonNode result = root.has("result") ? root.get("result") : root;

            alert.setTitle(getTextOrDefault(result, "search_name", "Splunk Alert"));
            alert.setDescription(getTextOrDefault(result, "description", "Alert from Splunk SIEM"));
            alert.setSourceId(getTextOrDefault(result, "sid", ""));
            alert.setSourceIp(getTextOrDefault(result, "src_ip", getTextOrDefault(result, "src", "")));
            alert.setDestinationIp(getTextOrDefault(result, "dest_ip", getTextOrDefault(result, "dest", "")));
            alert.setUserName(getTextOrDefault(result, "user", ""));
            alert.setHostName(getTextOrDefault(result, "host", ""));
            alert.setAttackCategory(getTextOrDefault(result, "category", getTextOrDefault(result, "type", "unknown")));

            // Map Splunk severity (1-10) to our enum
            alert.setSeverity(mapSplunkSeverity(result));

        } catch (Exception e) {
            // If parsing fails, create a minimal alert with the raw data
            alert.setTitle("Splunk Alert (parse error)");
            alert.setDescription("Failed to parse Splunk payload: " + e.getMessage());
            alert.setSeverity(Severity.MEDIUM);
        }

        return alert;
    }

    @Override
    public boolean supports(AlertSourceType sourceType) {
        return sourceType == AlertSourceType.SPLUNK || sourceType == AlertSourceType.CLOUD_SIEM;
    }

    private Severity mapSplunkSeverity(JsonNode node) {
        if (node.has("severity")) {
            String sevStr = node.get("severity").asText().toLowerCase();
            try {
                int sevNum = Integer.parseInt(sevStr);
                if (sevNum >= 8) return Severity.CRITICAL;
                if (sevNum >= 6) return Severity.HIGH;
                if (sevNum >= 4) return Severity.MEDIUM;
                return Severity.LOW;
            } catch (NumberFormatException e) {
                return mapStringSeverity(sevStr);
            }
        }
        return Severity.MEDIUM;
    }

    private Severity mapStringSeverity(String severity) {
        return switch (severity) {
            case "critical", "urgent" -> Severity.CRITICAL;
            case "high" -> Severity.HIGH;
            case "medium", "moderate" -> Severity.MEDIUM;
            default -> Severity.LOW;
        };
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        return node.has(field) ? node.get(field).asText() : defaultValue;
    }
}
