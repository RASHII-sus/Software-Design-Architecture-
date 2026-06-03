package com.sdapro.incident.domain.state;

import com.sdapro.shared.commons.IncidentStateType;

import java.util.Collections;
import java.util.List;

/**
 * // PATTERN: State (Concrete State — CLOSED)
 * // RATIONALE: Terminal state. ALL transition methods throw IllegalStateException.
 * //            No response actions are allowed. The incident lifecycle is complete.
 */
public class ClosedState implements IncidentState {

    // All default methods in IncidentState throw IllegalStateException,
    // so ClosedState doesn't need to override anything — it's inherently terminal.

    @Override
    public IncidentStateType getName() { return IncidentStateType.CLOSED; }

    @Override
    public List<IncidentStateType> getAllowedTransitions() {
        return Collections.emptyList();
    }
}
