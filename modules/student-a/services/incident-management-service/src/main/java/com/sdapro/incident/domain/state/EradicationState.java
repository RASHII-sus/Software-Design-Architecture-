package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.ResponseActionType;

import java.util.List;

/**
 * // PATTERN: State (Concrete State — ERADICATION)
 * // RATIONALE: Eradication phase — removing threat artifacts. Limited actions.
 */
public class EradicationState implements IncidentState {

    @Override
    public void beginRecovery(Incident incident) {
        incident.addActionLog("RECOVERY initiated — eradication complete.");
        incident.setState(new RecoveryState());
    }

    @Override
    public IncidentStateType getName() { return IncidentStateType.ERADICATION; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return List.of(IncidentStateType.RECOVERY);
    }

    @Override
    public List<ResponseActionType> getAllowedActions() {
        return List.of(
            ResponseActionType.QUARANTINE_FILE,
            ResponseActionType.BLOCK_IP,
            ResponseActionType.BLOCK_DOMAIN
        );
    }
}
