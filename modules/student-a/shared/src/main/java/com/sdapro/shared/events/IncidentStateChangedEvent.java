package com.sdapro.shared.events;

import com.sdapro.shared.commons.IncidentStateType;

import java.util.UUID;

/**
 * Published when an incident transitions between lifecycle states.
 * Subscribers: Dashboard, Audit Service, Metrics Collector.
 */
public class IncidentStateChangedEvent extends DomainEvent {

    private final UUID incidentId;
    private final IncidentStateType previousState;
    private final IncidentStateType newState;
    private final String triggeredBy;
    private final String reason;

    public IncidentStateChangedEvent(UUID incidentId, IncidentStateType previousState,
                                     IncidentStateType newState, String triggeredBy, String reason) {
        super("IncidentStateChanged", "incident-management-service");
        this.incidentId = incidentId;
        this.previousState = previousState;
        this.newState = newState;
        this.triggeredBy = triggeredBy;
        this.reason = reason;
    }

    public UUID getIncidentId() { return incidentId; }
    public IncidentStateType getPreviousState() { return previousState; }
    public IncidentStateType getNewState() { return newState; }
    public String getTriggeredBy() { return triggeredBy; }
    public String getReason() { return reason; }
}
