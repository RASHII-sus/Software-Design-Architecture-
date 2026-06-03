package com.sdapro.shared.commons;

/**
 * All possible states in the incident lifecycle.
 * Used by the State pattern in the Incident Management Service.
 *
 * Flow: NEW → UNDER_TRIAGE → CONTAINMENT → ERADICATION → RECOVERY → POST_INCIDENT_REVIEW → CLOSED
 */
public enum IncidentStateType {
    NEW,
    UNDER_TRIAGE,
    CONTAINMENT,
    ERADICATION,
    RECOVERY,
    POST_INCIDENT_REVIEW,
    CLOSED
}
