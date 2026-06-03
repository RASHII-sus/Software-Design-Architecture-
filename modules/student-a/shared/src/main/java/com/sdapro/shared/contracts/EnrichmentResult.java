package com.sdapro.shared.contracts;

import com.sdapro.shared.commons.EnrichmentStatus;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Result of an enrichment pipeline execution.
 * Contains all context data added by enrichment handlers.
 */
public class EnrichmentResult {

    private UUID alertId;
    private EnrichmentStatus status;
    private Instant enrichedAt;
    private Map<String, Object> geoIpData;
    private Map<String, Object> threatIntelData;
    private Map<String, Object> assetContextData;
    private String classifiedSeverity;
    private boolean isDuplicate;
    private String handlerChainSummary;

    public EnrichmentResult() {
        this.enrichedAt = Instant.now();
        this.geoIpData = new HashMap<>();
        this.threatIntelData = new HashMap<>();
        this.assetContextData = new HashMap<>();
        this.isDuplicate = false;
    }

    public EnrichmentResult(UUID alertId, EnrichmentStatus status) {
        this();
        this.alertId = alertId;
        this.status = status;
    }

    // --- Getters and Setters ---

    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }

    public EnrichmentStatus getStatus() { return status; }
    public void setStatus(EnrichmentStatus status) { this.status = status; }

    public Instant getEnrichedAt() { return enrichedAt; }
    public void setEnrichedAt(Instant enrichedAt) { this.enrichedAt = enrichedAt; }

    public Map<String, Object> getGeoIpData() { return geoIpData; }
    public void setGeoIpData(Map<String, Object> geoIpData) { this.geoIpData = geoIpData; }

    public Map<String, Object> getThreatIntelData() { return threatIntelData; }
    public void setThreatIntelData(Map<String, Object> threatIntelData) { this.threatIntelData = threatIntelData; }

    public Map<String, Object> getAssetContextData() { return assetContextData; }
    public void setAssetContextData(Map<String, Object> assetContextData) { this.assetContextData = assetContextData; }

    public String getClassifiedSeverity() { return classifiedSeverity; }
    public void setClassifiedSeverity(String classifiedSeverity) { this.classifiedSeverity = classifiedSeverity; }

    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean duplicate) { isDuplicate = duplicate; }

    public String getHandlerChainSummary() { return handlerChainSummary; }
    public void setHandlerChainSummary(String handlerChainSummary) { this.handlerChainSummary = handlerChainSummary; }
}
