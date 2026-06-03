package com.sdapro.alertingestion.domain.source;

import com.sdapro.shared.commons.AlertSourceType;

import jakarta.persistence.*;
import java.util.UUID;

/**
 * Represents a configured alert data source (e.g., a Splunk instance, CrowdStrike tenant).
 */
@Entity
@Table(name = "alert_sources")
public class AlertSource {

    @Id
    private UUID id;

    private String name;

    @Enumerated(EnumType.STRING)
    private AlertSourceType type;

    private String endpoint;
    private String apiKey;
    private boolean enabled;
    private int pollingIntervalSeconds;

    protected AlertSource() {}

    public AlertSource(String name, AlertSourceType type, String endpoint) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.type = type;
        this.endpoint = endpoint;
        this.enabled = true;
        this.pollingIntervalSeconds = 60;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public AlertSourceType getType() { return type; }
    public void setType(AlertSourceType type) { this.type = type; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getPollingIntervalSeconds() { return pollingIntervalSeconds; }
    public void setPollingIntervalSeconds(int pollingIntervalSeconds) { this.pollingIntervalSeconds = pollingIntervalSeconds; }
}
