package com.sdapro.incident.domain.incident;

import com.sdapro.incident.domain.state.*;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.ResponseActionType;
import com.sdapro.shared.commons.Severity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: State (Context)
 * // RATIONALE: Incident delegates state-specific behavior to its currentState object.
 * //            The Incident entity maintains the context and forwards all lifecycle
 * //            operations to the current state, which determines what's allowed.
 *
 * Incident aggregate root — the central entity managing the incident lifecycle.
 * Delegates all state-dependent behavior to the current IncidentState.
 */
@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    private UUID id;

    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    /** Persisted state type — stored in database */
    @Enumerated(EnumType.STRING)
    private IncidentStateType currentStateType;

    /** Runtime state object — reconstructed from currentStateType */
    @Transient
    private IncidentState currentState;

    private UUID assignedAnalystId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "incident_alert_ids", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "alert_id")
    private List<UUID> alertIds;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant closedAt;

    @Column(length = 2000)
    private String closureSummary;

    private String escalationReason;
    private boolean isEscalated;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "incident_action_log", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "action_entry", length = 1000)
    private List<String> responseActionsLog;

    /** JPA no-arg constructor */
    protected Incident() {
        this.alertIds = new ArrayList<>();
        this.responseActionsLog = new ArrayList<>();
    }

    /**
     * Create a new incident in the NEW state.
     */
    public Incident(String title, String description, Severity severity, List<UUID> alertIds) {
        this();
        this.id = UUID.randomUUID();
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.alertIds = alertIds != null ? new ArrayList<>(alertIds) : new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();

        // Start in NEW state
        this.currentStateType = IncidentStateType.NEW;
        this.currentState = new NewState();
    }

    // ========================================================================
    // STATE PATTERN — Delegate methods
    // Each method forwards to the current state, which determines if it's legal
    // ========================================================================

    /** Delegate to current state: begin triage */
    public void beginTriage(UUID analystId) {
        ensureStateInitialized();
        currentState.beginTriage(this, analystId);
    }

    /** Delegate to current state: initiate containment */
    public void initiateContainment(List<String> actions) {
        ensureStateInitialized();
        currentState.initiateContainment(this, actions);
    }

    /** Delegate to current state: begin eradication */
    public void beginEradication() {
        ensureStateInitialized();
        currentState.beginEradication(this);
    }

    /** Delegate to current state: begin recovery */
    public void beginRecovery() {
        ensureStateInitialized();
        currentState.beginRecovery(this);
    }

    /** Delegate to current state: start post-incident review */
    public void startPostIncidentReview() {
        ensureStateInitialized();
        currentState.startPostIncidentReview(this);
    }

    /** Delegate to current state: close incident */
    public void close(String summary) {
        ensureStateInitialized();
        currentState.close(this, summary);
    }

    /** Delegate to current state: escalate */
    public void escalate(String reason) {
        ensureStateInitialized();
        currentState.escalate(this, reason);
    }

    // ========================================================================
    // State management
    // ========================================================================

    /**
     * Set the new state — called by state objects during transitions.
     * Updates both the runtime state and the persisted state type.
     */
    public void setState(IncidentState newState) {
        this.currentState = newState;
        this.currentStateType = newState.getName();
        this.updatedAt = Instant.now();

        if (newState.getName() == IncidentStateType.CLOSED) {
            this.closedAt = Instant.now();
        }
    }

    /**
     * Reconstruct the state object from the persisted state type.
     * Called after loading from database.
     */
    @PostLoad
    public void initializeState() {
        this.currentState = stateFromType(this.currentStateType);
    }

    private void ensureStateInitialized() {
        if (currentState == null) {
            initializeState();
        }
    }

    /**
     * Factory method: create the correct IncidentState from a state type enum.
     */
    public static IncidentState stateFromType(IncidentStateType type) {
        return switch (type) {
            case NEW -> new NewState();
            case UNDER_TRIAGE -> new UnderTriageState();
            case CONTAINMENT -> new ContainmentState();
            case ERADICATION -> new EradicationState();
            case RECOVERY -> new RecoveryState();
            case POST_INCIDENT_REVIEW -> new PostIncidentReviewState();
            case CLOSED -> new ClosedState();
        };
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    public void addActionLog(String entry) {
        responseActionsLog.add("[" + Instant.now() + "] " + entry);
    }

    public List<IncidentStateType> getAllowedTransitions() {
        ensureStateInitialized();
        return currentState.getAllowedTransitions();
    }

    public List<ResponseActionType> getAllowedActions() {
        ensureStateInitialized();
        return currentState.getAllowedActions();
    }

    // ========================================================================
    // Getters and Setters
    // ========================================================================

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }

    public IncidentStateType getCurrentStateType() { return currentStateType; }

    public UUID getAssignedAnalystId() { return assignedAnalystId; }
    public void setAssignedAnalystId(UUID assignedAnalystId) { this.assignedAnalystId = assignedAnalystId; }

    public List<UUID> getAlertIds() { return alertIds; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getClosedAt() { return closedAt; }

    public String getClosureSummary() { return closureSummary; }
    public void setClosureSummary(String closureSummary) { this.closureSummary = closureSummary; }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public boolean isEscalated() { return isEscalated; }
    public void setEscalated(boolean escalated) { this.isEscalated = escalated; }

    public List<String> getResponseActionsLog() { return responseActionsLog; }

    @Override
    public String toString() {
        return "Incident{id=" + id + ", title='" + title + "', severity=" + severity +
               ", state=" + currentStateType + "}";
    }
}
