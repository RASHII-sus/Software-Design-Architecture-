package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.ResponseActionType;

import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: State (Concrete State — UNDER_TRIAGE)
 * // RATIONALE: Analyst is investigating the incident. Allows limited investigation
 * //            actions and transition to CONTAINMENT.
 */
public class UnderTriageState implements IncidentState {

    @Override
    public void initiateContainment(Incident incident, List<String> actions) {
        incident.addActionLog("CONTAINMENT initiated with actions: " + String.join(", ", actions));
        incident.setState(new ContainmentState());
    }

    @Override
    public void escalate(Incident incident, String reason) {
        incident.setEscalated(true);
        incident.setEscalationReason(reason);
        incident.addActionLog("ESCALATED from UNDER_TRIAGE: " + reason);
    }

    @Override
    public IncidentStateType getName() { return IncidentStateType.UNDER_TRIAGE; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return List.of(IncidentStateType.CONTAINMENT);
    }

    @Override
    public List<ResponseActionType> getAllowedActions() {
        return List.of(ResponseActionType.ISOLATE_ENDPOINT, ResponseActionType.BLOCK_IP);
    }
}
