package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;

import java.util.List;

/**
 * // PATTERN: State (Concrete State — RECOVERY)
 * // RATIONALE: Recovery phase — restoring systems. Monitoring only, no response actions.
 */
public class RecoveryState implements IncidentState {

    @Override
    public void startPostIncidentReview(Incident incident) {
        incident.addActionLog("POST_INCIDENT_REVIEW started — recovery complete.");
        incident.setState(new PostIncidentReviewState());
    }

    @Override
    public IncidentStateType getName() { return IncidentStateType.RECOVERY; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return List.of(IncidentStateType.POST_INCIDENT_REVIEW);
    }
}
