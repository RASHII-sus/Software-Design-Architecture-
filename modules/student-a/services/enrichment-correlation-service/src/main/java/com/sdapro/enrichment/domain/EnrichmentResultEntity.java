package com.sdapro.enrichment.domain;

import com.sdapro.shared.commons.EnrichmentStatus;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Persistent entity storing the result of an enrichment pipeline execution.
 */
@Entity
@Table(name = "enrichment_results")
public class EnrichmentResultEntity {

    @Id
    private UUID id;

    private UUID alertId;

    @Enumerated(EnumType.STRING)
    private EnrichmentStatus status;

    private Instant enrichedAt;

    @Column(columnDefinition = "TEXT")
    private String geoIpData;

    @Column(columnDefinition = "TEXT")
    private String threatIntelData;

    @Column(columnDefinition = "TEXT")
    private String assetContextData;

    private String classifiedSeverity;
    private boolean isDuplicate;

    @Column(columnDefinition = "TEXT")
    private String handlerChainSummary;

    protected EnrichmentResultEntity() {}

    public EnrichmentResultEntity(UUID alertId, EnrichmentStatus status) {
        this.id = UUID.randomUUID();
        this.alertId = alertId;
        this.status = status;
        this.enrichedAt = Instant.now();
    }

    // --- Getters and Setters ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }

    public EnrichmentStatus getStatus() { return status; }
    public void setStatus(EnrichmentStatus status) { this.status = status; }

    public Instant getEnrichedAt() { return enrichedAt; }

    public String getGeoIpData() { return geoIpData; }
    public void setGeoIpData(String geoIpData) { this.geoIpData = geoIpData; }

    public String getThreatIntelData() { return threatIntelData; }
    public void setThreatIntelData(String threatIntelData) { this.threatIntelData = threatIntelData; }

    public String getAssetContextData() { return assetContextData; }
    public void setAssetContextData(String assetContextData) { this.assetContextData = assetContextData; }

    public String getClassifiedSeverity() { return classifiedSeverity; }
    public void setClassifiedSeverity(String classifiedSeverity) { this.classifiedSeverity = classifiedSeverity; }

    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean duplicate) { isDuplicate = duplicate; }

    public String getHandlerChainSummary() { return handlerChainSummary; }
    public void setHandlerChainSummary(String handlerChainSummary) { this.handlerChainSummary = handlerChainSummary; }
}
