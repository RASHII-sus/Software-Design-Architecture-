package com.sdapro.event;

import com.sdapro.model.AlertEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * EventBus - Student C core component.
 * Implements Event-Driven Architecture using RabbitMQ.
 *
 * Design Pattern: Observer Pattern
 *   - Publishers push events to the bus
 *   - Subscribers (handlers) react to events asynchronously
 *
 * Architecture Style: Event-Driven
 *   - Decouples alert ingestion from enrichment, notification, and SOA
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EventBus {

    // PATTERN: Observer
    // RATIONALE: Publishers emit SocEvent messages and registered subscribers react without tight coupling.
    //
    // PATTERN: Singleton
    // RATIONALE: Spring manages one EventBus component as the shared event coordination point.

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange}")
    private String exchange;

    @Value("${rabbitmq.routing.alert}")
    private String alertRoutingKey;

    @Value("${rabbitmq.routing.incident}")
    private String incidentRoutingKey;

    @Value("${rabbitmq.routing.notification}")
    private String notificationRoutingKey;

    // In-memory local subscribers for same-JVM event handling (Observer Pattern)
    private final Map<EventType, List<Consumer<SocEvent>>> subscribers = new HashMap<>();

    // =========================================================
    // PUBLISH METHODS
    // =========================================================

    /**
     * Publish an alert event to the event bus.
     * Triggers: alert ingestion, enrichment, SOA orchestration, notifications.
     */
    public void publishAlertEvent(AlertEvent alert, EventType eventType) {
        SocEvent event = SocEvent.builder()
                .eventType(eventType)
                .alertId(alert.getAlertId())
                .severity(alert.getSeverity().name())
                .payload(buildPayload(alert))
                .build();

        log.info("[EventBus] Publishing {} event for alert: {}", eventType, alert.getAlertId());

        // Push to RabbitMQ (distributed)
        try {
            rabbitTemplate.convertAndSend(exchange, alertRoutingKey, event);
        } catch (Exception e) {
            log.warn("[EventBus] RabbitMQ unavailable, using local delivery only: {}", e.getMessage());
        }

        // Notify local subscribers (Observer Pattern)
        notifyLocalSubscribers(event);
    }

    /**
     * Publish an incident escalation event.
     */
    public void publishIncidentEscalation(String alertId, String fromStatus, String toStatus) {
        SocEvent event = SocEvent.builder()
                .eventType(EventType.INCIDENT_ESCALATED)
                .alertId(alertId)
                .payload(Map.of("from", fromStatus, "to", toStatus, "alertId", alertId))
                .build();

        log.info("[EventBus] Publishing INCIDENT_ESCALATED: {} -> {}", fromStatus, toStatus);

        try {
            rabbitTemplate.convertAndSend(exchange, incidentRoutingKey, event);
        } catch (Exception e) {
            log.warn("[EventBus] RabbitMQ unavailable: {}", e.getMessage());
        }

        notifyLocalSubscribers(event);
    }

    /**
     * Publish a SOC notification (e.g., analyst assigned, alert resolved).
     */
    public void publishNotification(String message, String targetAnalyst, EventType eventType) {
        SocEvent event = SocEvent.builder()
                .eventType(eventType)
                .payload(Map.of("message", message, "analyst", targetAnalyst))
                .build();

        log.info("[EventBus] Publishing notification to analyst: {}", targetAnalyst);

        try {
            rabbitTemplate.convertAndSend(exchange, notificationRoutingKey, event);
        } catch (Exception e) {
            log.warn("[EventBus] RabbitMQ unavailable: {}", e.getMessage());
        }

        notifyLocalSubscribers(event);
    }

    // =========================================================
    // SUBSCRIBE METHODS (Observer Pattern)
    // =========================================================

    /**
     * Subscribe to a specific event type (Observer Pattern registration).
     */
    public void subscribe(EventType eventType, Consumer<SocEvent> handler) {
        subscribers.computeIfAbsent(eventType, k -> new ArrayList<>()).add(handler);
        log.info("[EventBus] Registered subscriber for event type: {}", eventType);
    }

    /**
     * Notify all local subscribers for an event type.
     */
    private void notifyLocalSubscribers(SocEvent event) {
        List<Consumer<SocEvent>> handlers = subscribers.getOrDefault(event.getEventType(), List.of());
        handlers.forEach(h -> {
            try {
                h.accept(event);
            } catch (Exception e) {
                log.error("[EventBus] Subscriber error for {}: {}", event.getEventType(), e.getMessage());
            }
        });
    }

    private Map<String, Object> buildPayload(AlertEvent alert) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("alertId", alert.getAlertId());
        payload.put("title", alert.getTitle());
        payload.put("severity", alert.getSeverity().name());
        payload.put("status", alert.getStatus().name());
        payload.put("sourceIp", alert.getSourceIp());
        payload.put("attackType", alert.getAttackType());
        return payload;
    }

    // =========================================================
    // EVENT TYPES ENUM
    // =========================================================

    public enum EventType {
        ALERT_CREATED,
        ALERT_UPDATED,
        ALERT_ENRICHED,
        ALERT_ASSIGNED,
        ALERT_ESCALATED,
        ALERT_RESOLVED,
        ALERT_CLOSED,
        INCIDENT_CREATED,
        INCIDENT_ESCALATED,
        INCIDENT_RESOLVED,
        ANALYST_NOTIFIED,
        THREAT_INTEL_UPDATED,
        DASHBOARD_REFRESH
    }
}
