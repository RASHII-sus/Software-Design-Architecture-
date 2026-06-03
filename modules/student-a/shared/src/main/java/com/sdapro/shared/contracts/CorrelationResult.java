package com.sdapro.shared.contracts;

import java.util.UUID;

/**
 * Result of the correlation strategy execution.
 * Determines whether an incident should be created from correlated alerts.
 */
public class CorrelationResult {

    public enum Action {
        /** Create a new incident from the correlated alerts */
        CREATE_INCIDENT,
        /** Merge into an existing incident */
        MERGE_INCIDENT,
        /** No incident — continue monitoring */
        NO_ACTION,
        /** Escalate for manual review */
        ESCALATE
    }

    private Action action;
    private UUID existingIncidentId;
    private String correlationRule;
    private double confidenceScore;
    private String summary;

    public CorrelationResult() {}

    public CorrelationResult(Action action, String correlationRule, double confidenceScore) {
        this.action = action;
        this.correlationRule = correlationRule;
        this.confidenceScore = confidenceScore;
    }

    // --- Getters and Setters ---

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public UUID getExistingIncidentId() { return existingIncidentId; }
    public void setExistingIncidentId(UUID existingIncidentId) { this.existingIncidentId = existingIncidentId; }

    public String getCorrelationRule() { return correlationRule; }
    public void setCorrelationRule(String correlationRule) { this.correlationRule = correlationRule; }

    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    @Override
    public String toString() {
        return "CorrelationResult{action=" + action + ", rule='" + correlationRule +
               "', confidence=" + confidenceScore + "}";
    }
}
