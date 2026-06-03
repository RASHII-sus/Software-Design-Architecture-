package com.sdapro.alertingestion.domain.alert;

import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * // PATTERN: Composite (Leaf)
 * // RATIONALE: Represents an individual security alert — a leaf node in the
 * //            composite tree. Cannot contain children.
 *
 * A single, normalized security alert from any source (Splunk, CrowdStrike, Firewall, etc.).
 * This is the leaf node in the Composite pattern.
 */
@Entity
@Table(name = "single_alerts")
public class SingleAlert implements AlertComponent {

    @Id
    private UUID id;

    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    private AlertSourceType sourceType;

    private String sourceId;
    private String sourceIp;
    private String destinationIp;
    private String userName;
    private String hostName;
    private String attackCategory;

    @Column(columnDefinition = "TEXT")
    private String rawPayload;

    private Instant timestamp;
    private Instant createdAt;

    /** JPA requires a no-arg constructor. */
    protected SingleAlert() {}

    /**
     * Create a SingleAlert from a normalized CanonicalAlert.
     * This is typically called after the Factory Method normalizer has processed raw data.
     */
    public SingleAlert(CanonicalAlert canonical) {
        this.id = canonical.getId();
        this.title = canonical.getTitle();
        this.description = canonical.getDescription();
        this.severity = canonical.getSeverity();
        this.sourceType = canonical.getSourceType();
        this.sourceId = canonical.getSourceId();
        this.sourceIp = canonical.getSourceIp();
        this.destinationIp = canonical.getDestinationIp();
        this.userName = canonical.getUserName();
        this.hostName = canonical.getHostName();
        this.attackCategory = canonical.getAttackCategory();
        this.timestamp = canonical.getTimestamp();
        this.createdAt = Instant.now();
    }

    // --- AlertComponent interface (Composite Leaf) ---

    @Override
    public UUID getId() { return id; }

    @Override
    public Severity getSeverity() { return severity; }

    @Override
    public Instant getTimestamp() { return timestamp; }

    @Override
    public String getTitle() { return title; }

    @Override
    public boolean isLeaf() { return true; }
    // add(), remove(), getChildren() use default implementations that throw/return empty

    // --- Additional getters and setters ---

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public AlertSourceType getSourceType() { return sourceType; }
    public void setSourceType(AlertSourceType sourceType) { this.sourceType = sourceType; }

    public String getSourceId() { return sourceId; }
    public String getSourceIp() { return sourceIp; }
    public String getDestinationIp() { return destinationIp; }
    public String getUserName() { return userName; }
    public String getHostName() { return hostName; }
    public String getAttackCategory() { return attackCategory; }
    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(UUID id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    public void setDestinationIp(String destinationIp) { this.destinationIp = destinationIp; }
    public void setUserName(String userName) { this.userName = userName; }
    public void setHostName(String hostName) { this.hostName = hostName; }
    public void setAttackCategory(String attackCategory) { this.attackCategory = attackCategory; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    @Override
    public String toString() {
        return "SingleAlert{id=" + id + ", title='" + title + "', severity=" + severity +
               ", source=" + sourceType + "}";
    }
}
