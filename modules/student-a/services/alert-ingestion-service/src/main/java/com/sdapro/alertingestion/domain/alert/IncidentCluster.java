package com.sdapro.alertingestion.domain.alert;

import com.sdapro.shared.commons.Severity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: Composite (Composite Node)
 * // RATIONALE: An IncidentCluster groups correlated alerts detected by correlation rules.
 * //            Like AlertCampaign, it is treated uniformly with SingleAlert through
 * //            the AlertComponent interface.
 *
 * Groups correlated alerts into a cluster based on correlation rules (e.g., same source IP,
 * same attack pattern within a time window). Composite node in the alert tree.
 */
@Entity
@Table(name = "incident_clusters")
public class IncidentCluster implements AlertComponent {

    @Id
    private UUID id;

    private String clusterName;
    private String correlationRule;
    private Instant timestamp;
    private Instant createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "cluster_alert_ids", joinColumns = @JoinColumn(name = "cluster_id"))
    @Column(name = "alert_id")
    private List<UUID> childAlertIds;

    @Transient
    private List<AlertComponent> children;

    protected IncidentCluster() {
        this.childAlertIds = new ArrayList<>();
        this.children = new ArrayList<>();
    }

    public IncidentCluster(String clusterName, String correlationRule) {
        this();
        this.id = UUID.randomUUID();
        this.clusterName = clusterName;
        this.correlationRule = correlationRule;
        this.timestamp = Instant.now();
        this.createdAt = Instant.now();
    }

    // --- AlertComponent interface (Composite) ---

    @Override
    public UUID getId() { return id; }

    @Override
    public Severity getSeverity() {
        Severity maxSeverity = Severity.LOW;
        for (AlertComponent child : children) {
            Severity childSeverity = child.getSeverity();
            if (childSeverity != null && childSeverity.ordinal() > maxSeverity.ordinal()) {
                maxSeverity = childSeverity;
            }
        }
        return maxSeverity;
    }

    @Override
    public Instant getTimestamp() { return timestamp; }

    @Override
    public String getTitle() { return "Cluster: " + clusterName; }

    @Override
    public void add(AlertComponent component) {
        children.add(component);
        childAlertIds.add(component.getId());
    }

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

    // --- Additional getters ---

    public String getClusterName() { return clusterName; }
    public void setClusterName(String clusterName) { this.clusterName = clusterName; }

    public String getCorrelationRule() { return correlationRule; }
    public void setCorrelationRule(String correlationRule) { this.correlationRule = correlationRule; }

    public List<UUID> getChildAlertIds() { return childAlertIds; }
    public Instant getCreatedAt() { return createdAt; }

    public void setResolvedChildren(List<AlertComponent> resolved) {
        this.children = new ArrayList<>(resolved);
    }

    public void setId(UUID id) { this.id = id; }

    @Override
    public String toString() {
        return "IncidentCluster{id=" + id + ", name='" + clusterName +
               "', rule='" + correlationRule + "', children=" + childAlertIds.size() + "}";
    }
}
