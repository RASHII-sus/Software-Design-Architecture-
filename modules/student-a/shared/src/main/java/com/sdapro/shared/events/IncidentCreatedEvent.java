package com.sdapro.shared.events;

import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.Severity;

import java.util.UUID;

/**
 * Published when a new incident is created by the Incident Management Service.
 * Subscribers: Dashboard, Notification Service, Response Orchestration Service.
 */
public class IncidentCreatedEvent extends DomainEvent {

    private final UUID incidentId;
    private final Severity severity;
    private final int alertCount;
    private final String summary;

    public IncidentCreatedEvent(UUID incidentId, Severity severity, int alertCount, String summary) {
        super("IncidentCreated", "incident-management-service");
        this.incidentId = incidentId;
        this.severity = severity;
        this.alertCount = alertCount;
        this.summary = summary;
    }

    public UUID getIncidentId() { return incidentId; }
    public Severity getSeverity() { return severity; }
    public int getAlertCount() { return alertCount; }
    public String getSummary() { return summary; }
}
