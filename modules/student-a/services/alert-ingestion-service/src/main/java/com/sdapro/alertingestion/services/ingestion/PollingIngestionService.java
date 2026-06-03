package com.sdapro.alertingestion.services.ingestion;

import com.sdapro.alertingestion.config.IngestionConfigManager;
import com.sdapro.alertingestion.domain.alert.SingleAlert;
import com.sdapro.shared.commons.AlertSourceType;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: Facade
 * // RATIONALE: Pull-based ingestion hides source polling details behind one simple
 * //            method while reusing the same canonical normalization pipeline as webhooks.
 *
 * Simulated pull/polling ingestion for API-backed alert sources.
 * In a production connector this class would call the configured endpoint and API key
 * from AlertSource; for the semester demo it produces deterministic source-shaped payloads.
 */
@Service
public class PollingIngestionService {

    private final AlertIngestionOrchestrator orchestrator;

    public PollingIngestionService(AlertIngestionOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    public List<SingleAlert> pollSource(AlertSourceType sourceType, int requestedBatchSize) {
        IngestionConfigManager.AlertSourceConfig config =
            IngestionConfigManager.getInstance().getSourceConfig(sourceType);
        int limit = Math.max(1, Math.min(requestedBatchSize, config.getMaxBatchSize()));

        List<SingleAlert> alerts = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            alerts.add(orchestrator.ingestAlert(sourceType, buildPayload(sourceType, i)));
        }
        return alerts;
    }

    private String buildPayload(AlertSourceType sourceType, int index) {
        String id = UUID.randomUUID().toString().substring(0, 8);
        String now = Instant.now().toString();

        return switch (sourceType) {
            case SPLUNK, CLOUD_SIEM -> """
                {
                  "result": {
                    "search_name": "Polled SIEM Suspicious Login",
                    "description": "Pull-mode SIEM alert collected at %s",
                    "sid": "poll-siem-%s-%d",
                    "src_ip": "198.51.100.%d",
                    "dest_ip": "10.0.0.15",
                    "user": "service.account",
                    "host": "identity-gateway-01",
                    "category": "credential-access",
                    "severity": "7"
                  }
                }
                """.formatted(now, id, index, 40 + index);
            case CROWDSTRIKE -> """
                {
                  "detect_name": "Polled EDR Credential Dumping",
                  "detect_description": "Pull-mode EDR detection collected at %s",
                  "detect_id": "poll-edr-%s-%d",
                  "device_external_ip": "203.0.113.%d",
                  "hostname": "workstation-%02d",
                  "severity": 5,
                  "tactic": "credential-access"
                }
                """.formatted(now, id, index, 20 + index, index + 1);
            case FIREWALL -> """
                {
                  "rule_name": "Polled Firewall Deny Event",
                  "message": "Pull-mode firewall event collected at %s",
                  "log_id": "poll-fw-%s-%d",
                  "src_ip": "192.0.2.%d",
                  "dst_ip": "10.0.0.25",
                  "action": "deny",
                  "threat_level": 3,
                  "device_name": "edge-fw-01"
                }
                """.formatted(now, id, index, 80 + index);
            case CUSTOM -> throw new IllegalArgumentException("CUSTOM source has no registered normalizer");
        };
    }
}
