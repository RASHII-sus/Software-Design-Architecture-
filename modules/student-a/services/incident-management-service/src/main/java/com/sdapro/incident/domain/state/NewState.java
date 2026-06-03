package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;

import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: State (Concrete State — NEW)
 * // RATIONALE: Initial state when an incident is first created. Only allows
 * //            beginTriage() and escalate() transitions.
 */
public class NewState implements IncidentState {

    @Override
    public void beginTriage(Incident incident, UUID analystId) {
        incident.setAssignedAnalystId(analystId);
        incident.setState(new UnderTriageState());
    }

    @Override
    public void escalate(Incident incident, String reason) {
        incident.setEscalated(true);
        incident.setEscalationReason(reason);
        incident.addActionLog("ESCALATED from NEW: " + reason);
        incident.setState(new UnderTriageState());
    }

    @Override
    public IncidentStateType getName() { return IncidentStateType.NEW; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return List.of(IncidentStateType.UNDER_TRIAGE);
    }
}
