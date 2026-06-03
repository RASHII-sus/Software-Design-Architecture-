package com.sdapro.orchestration;

import com.sdapro.event.EventBus;
import com.sdapro.model.AlertEvent;
import com.sdapro.model.AlertEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * SOAOrchestrator - Student C core component.
 *
 * Implements Service-Oriented Architecture (SOA) orchestration workflow:
 *
 *   Step 1: INGEST     → alert received and persisted
 *   Step 2: ENRICH     → threat intel lookup, IP geolocation, MITRE ATT&CK mapping
 *   Step 3: CORRELATE  → group related alerts into incidents
 *   Step 4: TRIAGE     → auto-prioritize based on severity + attack type
 *   Step 5: ASSIGN     → route to analyst by workload balancing
 *   Step 6: NOTIFY     → push to event bus and WebSocket dashboard
 *
 * Design Patterns used:
 *   - Chain of Responsibility: each step passes alert to next handler
 *   - Strategy: different enrichment and triage strategies per severity
 *   - Facade: single orchestrate() method hides all complexity
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SOAOrchestrator {

    // PATTERN: Facade
    // RATIONALE: orchestrate() gives clients one entry point for the multi-step SOC workflow.
    //
    // PATTERN: Chain of Responsibility
    // RATIONALE: Each injected handler performs one orchestration step and passes context forward.

    private final AlertEventRepository alertEventRepository;
    private final EventBus eventBus;

    // Inject the handler chain
    private final AlertIngestionHandler ingestionHandler;
    private final AlertEnrichmentHandler enrichmentHandler;
    private final AlertCorrelationHandler correlationHandler;
    private final AlertTriageHandler triageHandler;
    private final AlertAssignmentHandler assignmentHandler;
    private final AlertNotificationHandler notificationHandler;

    /**
     * FACADE METHOD: orchestrate() - the single entry point.
     * Runs the full 6-step SOA pipeline for a new alert.
     */
    @Transactional
    public AlertEvent orchestrate(AlertEvent alert) {
        log.info("[SOAOrchestrator] Starting orchestration for alert: {}", alert.getAlertId());

        OrchestrationContext ctx = OrchestrationContext.builder()
                .alert(alert)
                .startTime(LocalDateTime.now())
                .build();

        // Chain of Responsibility: pass through each handler
        ingestionHandler.handle(ctx);
        enrichmentHandler.handle(ctx);
        correlationHandler.handle(ctx);
        triageHandler.handle(ctx);
        assignmentHandler.handle(ctx);
        notificationHandler.handle(ctx);

        log.info("[SOAOrchestrator] Orchestration complete. Alert {} status: {}",
                alert.getAlertId(), ctx.getAlert().getStatus());

        // Publish ALERT_CREATED event to Event Bus
        eventBus.publishAlertEvent(ctx.getAlert(), EventBus.EventType.ALERT_CREATED);

        return ctx.getAlert();
    }

    /**
     * Escalate an existing alert through the lifecycle.
     * Example: NEW → UNDER_TRIAGE → CONTAINMENT
     */
    @Transactional
    public AlertEvent escalate(Long alertId, AlertEvent.AlertStatus newStatus) {
        AlertEvent alert = alertEventRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));

        String prevStatus = alert.getStatus().name();
        alert.setStatus(newStatus);
        alert = alertEventRepository.save(alert);

        // Publish escalation event
        eventBus.publishIncidentEscalation(alert.getAlertId(), prevStatus, newStatus.name());

        log.info("[SOAOrchestrator] Alert {} escalated: {} -> {}", alertId, prevStatus, newStatus);
        return alert;
    }

    /**
     * Close/resolve an alert - final lifecycle step.
     */
    @Transactional
    public AlertEvent resolve(Long alertId) {
        AlertEvent alert = alertEventRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));

        alert.setStatus(AlertEvent.AlertStatus.CLOSED);
        alert.setResolvedAt(LocalDateTime.now());
        alert = alertEventRepository.save(alert);

        eventBus.publishAlertEvent(alert, EventBus.EventType.ALERT_RESOLVED);

        log.info("[SOAOrchestrator] Alert {} RESOLVED.", alertId);
        return alert;
    }
}
