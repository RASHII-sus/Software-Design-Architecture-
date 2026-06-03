package com.sdapro.shared.events;

import java.time.Instant;
import java.util.UUID;

/**
 * Base class for all domain events in the SDA-Pro platform.
 * Events are published via the Event Bus (Observer pattern) for
 * loose coupling between SOA services.
 */
public abstract class DomainEvent {

    private final UUID eventId;
    private final String eventType;
    private final Instant occurredAt;
    private final String sourceService;

    protected DomainEvent(String eventType, String sourceService) {
        this.eventId = UUID.randomUUID();
        this.eventType = eventType;
        this.occurredAt = Instant.now();
        this.sourceService = sourceService;
    }

    public UUID getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getSourceService() { return sourceService; }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{eventId=" + eventId +
               ", type='" + eventType + "', at=" + occurredAt + "}";
    }
}
