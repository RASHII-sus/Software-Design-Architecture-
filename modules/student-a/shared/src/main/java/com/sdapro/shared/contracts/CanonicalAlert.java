package com.sdapro.shared.contracts;

import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Canonical alert representation used across all services.
 * All raw alert formats are normalized to this structure by the Factory Method normalizers.
 */
public class CanonicalAlert {

    private UUID id;
    private String title;
    private String description;
    private Severity severity;
    private AlertSourceType sourceType;
    private String sourceId;
    private Instant timestamp;
    private String sourceIp;
    private String destinationIp;
    private String userName;
    private String hostName;
    private String attackCategory;
    private Map<String, Object> additionalData;

    public CanonicalAlert() {
        this.id = UUID.randomUUID();
        this.timestamp = Instant.now();
    }

    // --- Getters and Setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }

    public AlertSourceType getSourceType() { return sourceType; }
    public void setSourceType(AlertSourceType sourceType) { this.sourceType = sourceType; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }

    public String getDestinationIp() { return destinationIp; }
    public void setDestinationIp(String destinationIp) { this.destinationIp = destinationIp; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getHostName() { return hostName; }
    public void setHostName(String hostName) { this.hostName = hostName; }

    public String getAttackCategory() { return attackCategory; }
    public void setAttackCategory(String attackCategory) { this.attackCategory = attackCategory; }

    public Map<String, Object> getAdditionalData() { return additionalData; }
    public void setAdditionalData(Map<String, Object> additionalData) { this.additionalData = additionalData; }

    @Override
    public String toString() {
        return "CanonicalAlert{id=" + id + ", title='" + title + "', severity=" + severity +
               ", source=" + sourceType + ", sourceIp='" + sourceIp + "'}";
    }
}
