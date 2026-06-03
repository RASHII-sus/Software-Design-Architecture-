package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * // PATTERN: Chain of Responsibility (Concrete Handler #4)
 * // RATIONALE: Enriches alerts with asset context — criticality, owner, business unit.
 *
 * Simulates asset inventory/CMDB lookup for demo purposes.
 */
@Component
public class AssetContextHandler extends EnrichmentHandler {

    private static final Map<String, Map<String, Object>> ASSET_DB = Map.of(
        "web-server-01", Map.of("criticality", "HIGH", "owner", "Platform Team", "businessUnit", "Engineering", "type", "Web Server"),
        "db-master-01", Map.of("criticality", "CRITICAL", "owner", "DBA Team", "businessUnit", "Engineering", "type", "Database"),
        "workstation-42", Map.of("criticality", "MEDIUM", "owner", "John Smith", "businessUnit", "Finance", "type", "Workstation"),
        "mail-server", Map.of("criticality", "HIGH", "owner", "IT Ops", "businessUnit", "IT", "type", "Mail Server"),
        "dev-server-03", Map.of("criticality", "LOW", "owner", "Dev Team", "businessUnit", "Engineering", "type", "Dev Server")
    );

    @Override
    protected EnrichmentResult doEnrich(CanonicalAlert alert, EnrichmentResult result) {
        String hostname = alert.getHostName();
        Map<String, Object> assetData = lookupAsset(hostname);
        result.setAssetContextData(assetData);
        return result;
    }

    @Override
    public String getHandlerName() {
        return "AssetContextHandler";
    }

    private Map<String, Object> lookupAsset(String hostname) {
        if (hostname == null || hostname.isEmpty()) {
            return Map.of("criticality", "UNKNOWN", "owner", "Unknown", "businessUnit", "Unknown", "type", "Unknown");
        }
        return ASSET_DB.getOrDefault(hostname,
            Map.of("criticality", "MEDIUM", "owner", "Unregistered", "businessUnit", "General", "type", "Unknown"));
    }
}
