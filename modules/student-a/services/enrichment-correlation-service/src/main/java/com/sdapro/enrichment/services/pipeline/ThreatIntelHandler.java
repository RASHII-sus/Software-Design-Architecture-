package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * // PATTERN: Chain of Responsibility (Concrete Handler #3)
 * // RATIONALE: Enriches alerts with threat intelligence data — reputation scores
 * //            and verdicts for IPs, domains, and file hashes.
 *
 * Simulates threat intel lookup. In production, calls Threat Intel Service (Student B).
 */
@Component
public class ThreatIntelHandler extends EnrichmentHandler {

    // Simulated known-malicious indicators
    private static final Set<String> MALICIOUS_IPS = Set.of(
        "203.0.113.50", "203.0.113.100", "198.51.100.1", "198.51.100.200",
        "45.33.32.156", "185.220.101.1"
    );
    private static final Set<String> SUSPICIOUS_IPS = Set.of(
        "45.33.49.50", "104.244.72.115", "91.219.236.222"
    );

    @Override
    protected EnrichmentResult doEnrich(CanonicalAlert alert, EnrichmentResult result) {
        String sourceIp = alert.getSourceIp();
        Map<String, Object> threatData = checkReputation(sourceIp);
        result.setThreatIntelData(threatData);
        return result;
    }

    @Override
    public String getHandlerName() {
        return "ThreatIntelHandler";
    }

    private Map<String, Object> checkReputation(String ip) {
        if (ip == null || ip.isEmpty()) {
            return Map.of("verdict", "UNKNOWN", "score", 0.0, "source", "none");
        }
        if (MALICIOUS_IPS.contains(ip)) {
            return Map.of("verdict", "MALICIOUS", "score", 95.0, "source", "VirusTotal+MISP",
                          "tags", "apt,c2-server,known-threat");
        }
        if (SUSPICIOUS_IPS.contains(ip)) {
            return Map.of("verdict", "SUSPICIOUS", "score", 65.0, "source", "VirusTotal",
                          "tags", "tor-exit,proxy");
        }
        if (ip.startsWith("192.168") || ip.startsWith("10.")) {
            return Map.of("verdict", "INTERNAL", "score", 0.0, "source", "internal-network");
        }
        return Map.of("verdict", "CLEAN", "score", 10.0, "source", "VirusTotal");
    }
}
