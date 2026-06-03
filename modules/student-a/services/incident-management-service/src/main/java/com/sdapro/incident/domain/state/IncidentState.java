package com.sdapro.incident.domain.state;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.ResponseActionType;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: State
 * // RATIONALE: Incident behavior and legal transitions vary by lifecycle phase.
 * //            Each state encapsulates what operations are allowed and how transitions
 * //            work, eliminating complex conditional logic. The State pattern ensures
 * //            that only valid transitions are possible and state-specific behavior
 * //            is cleanly separated.
 *
 * State interface for the incident lifecycle state machine.
 *
 * Lifecycle: NEW → UNDER_TRIAGE → CONTAINMENT → ERADICATION → RECOVERY
 *            → POST_INCIDENT_REVIEW → CLOSED
 *
 * Each concrete state implements only the transitions that are legal from that state.
 * All other transition methods throw IllegalStateException by default.
 */
public interface IncidentState {

    /** Transition: begin triage (assign analyst). Legal from: NEW */
    default void beginTriage(Incident incident, UUID analystId) {
        throw new IllegalStateException(
            "Cannot begin triage from " + getName() + " state.");
    }

    /** Transition: initiate containment. Legal from: UNDER_TRIAGE */
    default void initiateContainment(Incident incident, List<String> actions) {
        throw new IllegalStateException(
            "Cannot initiate containment from " + getName() + " state.");
    }

    /** Transition: begin eradication. Legal from: CONTAINMENT */
    default void beginEradication(Incident incident) {
        throw new IllegalStateException(
            "Cannot begin eradication from " + getName() + " state.");
    }

    /** Transition: begin recovery. Legal from: ERADICATION */
    default void beginRecovery(Incident incident) {
        throw new IllegalStateException(
            "Cannot begin recovery from " + getName() + " state.");
    }

    /** Transition: start post-incident review. Legal from: RECOVERY */
    default void startPostIncidentReview(Incident incident) {
        throw new IllegalStateException(
            "Cannot start post-incident review from " + getName() + " state.");
    }

    /** Transition: close incident. Legal from: POST_INCIDENT_REVIEW */
    default void close(Incident incident, String summary) {
        throw new IllegalStateException(
            "Cannot close incident from " + getName() + " state.");
    }

    /** Escalate the incident. Legal from: NEW, UNDER_TRIAGE, CONTAINMENT */
    default void escalate(Incident incident, String reason) {
        throw new IllegalStateException(
            "Cannot escalate from " + getName() + " state.");
    }

    /** Get the state type identifier. */
    IncidentStateType getName();

    /** Get the list of valid transitions from this state. */
    List<IncidentStateType> getAllowedTransitions();

    /** Get the response actions allowed in this state. */
    default List<ResponseActionType> getAllowedActions() {
        return Collections.emptyList();
    }
}
