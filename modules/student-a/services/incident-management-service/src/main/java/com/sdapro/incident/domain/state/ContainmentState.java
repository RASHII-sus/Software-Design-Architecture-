package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.ResponseActionType;

import java.util.List;

/**
 * // PATTERN: State (Concrete State — CONTAINMENT)
 * // RATIONALE: Active containment phase — all response actions are available.
 * //            Allows transition to ERADICATION once containment is complete.
 */
public class ContainmentState implements IncidentState {

    @Override
    public void beginEradication(Incident incident) {
        incident.addActionLog("ERADICATION initiated — containment verified.");
        incident.setState(new EradicationState());
    }

    @Override
    public void escalate(Incident incident, String reason) {
        incident.setEscalated(true);
        incident.setEscalationReason(reason);
        incident.addActionLog("ESCALATED from CONTAINMENT: " + reason);
    }

    @Override
    public IncidentStateType getName() { return IncidentStateType.CONTAINMENT; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return List.of(IncidentStateType.ERADICATION);
    }

    @Override
    public List<ResponseActionType> getAllowedActions() {
        return List.of(
            ResponseActionType.ISOLATE_ENDPOINT,
            ResponseActionType.BLOCK_IP,
            ResponseActionType.BLOCK_DOMAIN,
            ResponseActionType.DISABLE_USER_ACCOUNT,
            ResponseActionType.QUARANTINE_FILE
        );
    }
}
