package com.sdapro.shared.events;

import com.sdapro.shared.commons.EnrichmentStatus;

import java.util.UUID;

/**
 * Published when an alert has been enriched by the Enrichment & Correlation Service.
 * Subscribers: Correlation engine, Dashboard, Audit Service.
 */
public class AlertEnrichedEvent extends DomainEvent {

    private final UUID alertId;
    private final EnrichmentStatus status;
    private final String enrichmentSummary;

    public AlertEnrichedEvent(UUID alertId, EnrichmentStatus status, String enrichmentSummary) {
        super("AlertEnriched", "enrichment-correlation-service");
        this.alertId = alertId;
        this.status = status;
        this.enrichmentSummary = enrichmentSummary;
    }

    public UUID getAlertId() { return alertId; }
    public EnrichmentStatus getStatus() { return status; }
    public String getEnrichmentSummary() { return enrichmentSummary; }
}
