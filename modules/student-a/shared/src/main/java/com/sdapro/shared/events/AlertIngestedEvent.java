package com.sdapro.shared.events;

import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;

import java.util.UUID;

/**
 * Published when a new alert is ingested and normalized by the Alert Ingestion Service.
 * Subscribers: Enrichment Service, Dashboard, Audit Service.
 */
public class AlertIngestedEvent extends DomainEvent {

    private final UUID alertId;
    private final String alertTitle;
    private final Severity severity;
    private final AlertSourceType sourceType;
    private final boolean isComposite;

    public AlertIngestedEvent(UUID alertId, String alertTitle, Severity severity,
                              AlertSourceType sourceType, boolean isComposite) {
        super("AlertIngested", "alert-ingestion-service");
        this.alertId = alertId;
        this.alertTitle = alertTitle;
        this.severity = severity;
        this.sourceType = sourceType;
        this.isComposite = isComposite;
    }

    public UUID getAlertId() { return alertId; }
    public String getAlertTitle() { return alertTitle; }
    public Severity getSeverity() { return severity; }
    public AlertSourceType getSourceType() { return sourceType; }
    public boolean isComposite() { return isComposite; }
}
