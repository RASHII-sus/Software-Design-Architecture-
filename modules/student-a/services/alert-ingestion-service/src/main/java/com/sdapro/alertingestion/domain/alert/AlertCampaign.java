package com.sdapro.alertingestion.domain.alert;

import com.sdapro.shared.commons.Severity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: Composite (Composite Node)
 * // RATIONALE: A Campaign groups multiple related alerts (e.g., multi-stage APT attack).
 * //            It is treated uniformly with SingleAlert through the AlertComponent interface —
 * //            both can be enriched, analyzed, and responded to using the same operations.
 *
 * Represents a multi-stage attack campaign containing multiple related alerts.
 * This is a composite node in the Composite pattern — it holds children (SingleAlert or nested composites).
 */
@Entity
@Table(name = "alert_campaigns")
public class AlertCampaign implements AlertComponent {

    @Id
    private UUID id;

    private String campaignName;
    private String attackPattern;
    private Instant timestamp;
    private Instant createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "campaign_alert_ids", joinColumns = @JoinColumn(name = "campaign_id"))
    @Column(name = "alert_id")
    private List<UUID> childAlertIds;

    /** Transient list of resolved AlertComponent children (populated at runtime). */
    @Transient
    private List<AlertComponent> children;

    /** JPA no-arg constructor. */
    protected AlertCampaign() {
        this.childAlertIds = new ArrayList<>();
        this.children = new ArrayList<>();
    }

    public AlertCampaign(String campaignName, String attackPattern) {
        this();
        this.id = UUID.randomUUID();
        this.campaignName = campaignName;
        this.attackPattern = attackPattern;
        this.timestamp = Instant.now();
        this.createdAt = Instant.now();
    }

    // --- AlertComponent interface (Composite) ---

    @Override
    public UUID getId() { return id; }

    /**
     * Returns the maximum severity among all children.
     * This is a key Composite behavior — the severity of a campaign
     * is derived from its most severe child alert.
     */
    @Override
    public Severity getSeverity() {
        return getMaxSeverity();
    }

    @Override
    public Instant getTimestamp() { return timestamp; }

    @Override
    public String getTitle() { return "Campaign: " + campaignName; }

    /**
     * // PATTERN: Composite — add child component
     * Adds a child alert to this campaign (can be SingleAlert or nested composite).
     */
    @Override
    public void add(AlertComponent component) {
        children.add(component);
        childAlertIds.add(component.getId());
    }

    /**
     * // PATTERN: Composite — remove child component
     */
    @Override
    public void remove(AlertComponent component) {
        children.remove(component);
        childAlertIds.remove(component.getId());
    }

    @Override
    public List<AlertComponent> getChildren() {
        return new ArrayList<>(children);
    }

    @Override
    public boolean isLeaf() { return false; }

    /**
     * Compute the maximum severity across all child alerts.
     * Demonstrates Composite traversal — recursively checks children.
     */
    public Severity getMaxSeverity() {
        Severity maxSeverity = Severity.LOW;
        for (AlertComponent child : children) {
            Severity childSeverity = child.getSeverity();
            if (childSeverity != null && childSeverity.ordinal() > maxSeverity.ordinal()) {
                maxSeverity = childSeverity;
            }
        }
        return maxSeverity;
    }

    // --- Additional getters and setters ---

    public String getCampaignName() { return campaignName; }
    public void setCampaignName(String campaignName) { this.campaignName = campaignName; }

    public String getAttackPattern() { return attackPattern; }
    public void setAttackPattern(String attackPattern) { this.attackPattern = attackPattern; }

    public List<UUID> getChildAlertIds() { return childAlertIds; }

    public Instant getCreatedAt() { return createdAt; }

    /**
     * Set the resolved children list (used when loading from DB and resolving IDs).
     */
    public void setResolvedChildren(List<AlertComponent> resolved) {
        this.children = new ArrayList<>(resolved);
    }

    public void setId(UUID id) { this.id = id; }

    @Override
    public String toString() {
        return "AlertCampaign{id=" + id + ", name='" + campaignName +
               "', children=" + childAlertIds.size() + ", maxSeverity=" + getMaxSeverity() + "}";
    }
}
