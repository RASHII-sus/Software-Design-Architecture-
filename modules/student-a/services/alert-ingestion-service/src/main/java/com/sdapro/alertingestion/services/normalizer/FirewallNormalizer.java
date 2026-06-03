package com.sdapro.alertingestion.services.normalizer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;
import org.springframework.stereotype.Component;

/**
 * // PATTERN: Factory Method (Concrete Product)
 * // RATIONALE: Firewall logs arrive in syslog-style or structured JSON format.
 * //            This normalizer handles both and maps to the canonical model.
 *
 * Normalizer for firewall log payloads (e.g., Palo Alto, Fortinet, pfSense).
 */
@Component
public class FirewallNormalizer implements AlertNormalizer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public CanonicalAlert normalize(String rawPayload) {
        CanonicalAlert alert = new CanonicalAlert();
        alert.setSourceType(AlertSourceType.FIREWALL);

        try {
            JsonNode root = objectMapper.readTree(rawPayload);

            alert.setTitle(getTextOrDefault(root, "rule_name",
                           getTextOrDefault(root, "alert_name", "Firewall Alert")));
            alert.setDescription(getTextOrDefault(root, "message",
                                 "Firewall event: " + getTextOrDefault(root, "action", "unknown")));
            alert.setSourceId(getTextOrDefault(root, "log_id",
                              getTextOrDefault(root, "event_id", "")));
            alert.setSourceIp(getTextOrDefault(root, "src_ip",
                              getTextOrDefault(root, "source_address", "")));
            alert.setDestinationIp(getTextOrDefault(root, "dst_ip",
                                   getTextOrDefault(root, "destination_address", "")));
            alert.setUserName(getTextOrDefault(root, "src_user", ""));
            alert.setHostName(getTextOrDefault(root, "device_name",
                              getTextOrDefault(root, "firewall_name", "")));

            // Map firewall action to attack category
            String action = getTextOrDefault(root, "action", "").toLowerCase();
            alert.setAttackCategory(mapFirewallAction(action));

            // Map threat level
            alert.setSeverity(mapFirewallSeverity(root, action));

        } catch (Exception e) {
            alert.setTitle("Firewall Alert (parse error)");
            alert.setDescription("Failed to parse firewall payload: " + e.getMessage());
            alert.setSeverity(Severity.MEDIUM);
        }

        return alert;
    }

    @Override
    public boolean supports(AlertSourceType sourceType) {
        return sourceType == AlertSourceType.FIREWALL;
    }

    private String mapFirewallAction(String action) {
        return switch (action) {
            case "deny", "drop", "block" -> "network-intrusion";
            case "alert", "warn" -> "network-suspicious";
            case "allow" -> "network-allowed";
            default -> "network-event";
        };
    }

    private Severity mapFirewallSeverity(JsonNode node, String action) {
        if (node.has("threat_level")) {
            int level = node.get("threat_level").asInt(1);
            if (level >= 4) return Severity.CRITICAL;
            if (level >= 3) return Severity.HIGH;
            if (level >= 2) return Severity.MEDIUM;
            return Severity.LOW;
        }
        // Infer from action
        return switch (action) {
            case "deny", "drop", "block" -> Severity.HIGH;
            case "alert", "warn" -> Severity.MEDIUM;
            default -> Severity.LOW;
        };
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        return node.has(field) ? node.get(field).asText() : defaultValue;
    }
}
