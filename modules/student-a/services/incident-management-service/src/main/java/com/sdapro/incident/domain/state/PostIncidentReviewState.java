package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;

import java.util.List;

/**
 * // PATTERN: State (Concrete State — POST_INCIDENT_REVIEW)
 * // RATIONALE: Lessons-learned phase. Only allows close() transition.
 */
public class PostIncidentReviewState implements IncidentState {

    @Override
    public void close(Incident incident, String summary) {
        incident.setClosureSummary(summary);
        incident.addActionLog("CLOSED with summary: " + summary);
        incident.setState(new ClosedState());
    }

    @Override
    public IncidentStateType getName() { return IncidentStateType.POST_INCIDENT_REVIEW; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return List.of(IncidentStateType.CLOSED);
    }
}
