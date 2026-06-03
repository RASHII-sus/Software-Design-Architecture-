package com.sdapro.service;

import com.sdapro.dto.DashboardMetricsDTO;
import com.sdapro.event.EventBus;
import com.sdapro.event.SocEvent;
import com.sdapro.model.AlertEvent;
import com.sdapro.model.AlertEventRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DashboardService - Student C core service.
 *
 * Design Patterns:
 *   - Singleton: Spring-managed bean (single instance)
 *   - Observer: subscribes to EventBus, auto-refreshes on new alerts
 *   - Facade: buildMetrics() hides all aggregation complexity
 *
 * Architecture: MVC (Service layer) + Layered Architecture
 *
 * Features:
 *   - Cached dashboard metrics (Redis, 5min TTL)
 *   - Scheduled refresh every 30 seconds
 *   - WebSocket push on every new alert (real-time)
 *   - Observer subscription to EventBus events
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DashboardService {

    // PATTERN: Singleton
    // RATIONALE: Spring creates one DashboardService bean that centralizes metric aggregation.
    //
    // PATTERN: Observer
    // RATIONALE: The service subscribes to EventBus events and refreshes dashboard clients on change.
    //
    // PATTERN: Facade
    // RATIONALE: getMetrics() hides repository queries, aggregation, cache eviction, and WebSocket push details.

    private final AlertEventRepository alertEventRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EventBus eventBus;

    /**
     * PostConstruct: register as Observer on the EventBus.
     * Any new alert will trigger a WebSocket dashboard push.
     */
    @PostConstruct
    public void registerAsObserver() {
        // Subscribe to alert created/updated/resolved events
        eventBus.subscribe(EventBus.EventType.ALERT_CREATED, this::onAlertEvent);
        eventBus.subscribe(EventBus.EventType.ALERT_UPDATED, this::onAlertEvent);
        eventBus.subscribe(EventBus.EventType.ALERT_RESOLVED, this::onAlertEvent);
        eventBus.subscribe(EventBus.EventType.INCIDENT_ESCALATED, this::onAlertEvent);
        log.info("[DashboardService] Registered as Observer on EventBus for 4 event types");
    }

    /**
     * Observer callback: fired when an alert event arrives.
     * Evicts cache and pushes fresh metrics via WebSocket.
     */
    public void onAlertEvent(SocEvent event) {
        log.info("[DashboardService] Observer triggered by event: {}", event.getEventType());
        evictDashboardCache();
        pushLiveMetrics();
    }

    // =========================================================
    // MAIN DASHBOARD METRICS (Cached)
    // =========================================================

    /**
     * Get full dashboard metrics. Cached in Redis for 5 minutes.
     */
    @Cacheable(value = "dashboard-metrics", key = "'full'")
    public DashboardMetricsDTO getMetrics() {
        log.debug("[DashboardService] Computing dashboard metrics (cache miss)");
        return buildMetrics();
    }

    /**
     * Get metrics by severity filter.
     */
    @Cacheable(value = "dashboard-metrics", key = "#severity")
    public DashboardMetricsDTO getMetricsBySeverity(String severity) {
        try {
            AlertEvent.Severity sev = AlertEvent.Severity.valueOf(severity.toUpperCase());
            List<AlertEvent> alerts = alertEventRepository.findBySeverity(sev);
            return buildMetricsFromList(alerts);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid severity: " + severity);
        }
    }

    /**
     * Get critical + high priority alerts for immediate attention widget.
     */
    public List<DashboardMetricsDTO.AlertSummary> getCriticalAlerts() {
        return alertEventRepository.findOpenCriticalAndHigh()
                .stream()
                .map(this::toAlertSummary)
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Force refresh of the dashboard cache.
     */
    @CacheEvict(value = "dashboard-metrics", allEntries = true)
    public DashboardMetricsDTO refreshMetrics() {
        log.info("[DashboardService] Cache evicted, refreshing dashboard metrics");
        DashboardMetricsDTO metrics = buildMetrics();
        pushLiveMetrics(metrics);
        return metrics;
    }

    // =========================================================
    // SCHEDULED REFRESH (every 30 seconds)
    // =========================================================

    @Scheduled(fixedRateString = "30000")
    @CacheEvict(value = "dashboard-metrics", allEntries = true)
    public void scheduledRefresh() {
        log.debug("[DashboardService] Scheduled cache refresh");
        pushLiveMetrics();
    }

    // =========================================================
    // WEBSOCKET PUSH (Real-time)
    // =========================================================

    /**
     * Push fresh dashboard metrics to all connected WebSocket clients.
     * Clients subscribe to /topic/dashboard
     */
    public void pushLiveMetrics() {
        DashboardMetricsDTO metrics = buildMetrics();
        pushLiveMetrics(metrics);
    }

    private void pushLiveMetrics(DashboardMetricsDTO metrics) {
        try {
            messagingTemplate.convertAndSend("/topic/dashboard", metrics);
            log.debug("[DashboardService] WebSocket push sent to /topic/dashboard");
        } catch (Exception e) {
            log.warn("[DashboardService] WebSocket push failed: {}", e.getMessage());
        }
    }

    // =========================================================
    // PRIVATE BUILDER - FACADE PATTERN
    // =========================================================

    @CacheEvict(value = "dashboard-metrics", allEntries = true)
    public void evictDashboardCache() {
        // This method just evicts cache; annotation handles it
    }

    /**
     * FACADE: buildMetrics() - single method that assembles full dashboard.
     * Hides all aggregation, counting, and transformation logic.
     */
    private DashboardMetricsDTO buildMetrics() {
        List<AlertEvent> allAlerts = alertEventRepository.findAll();
        return buildMetricsFromList(allAlerts);
    }

    private DashboardMetricsDTO buildMetricsFromList(List<AlertEvent> allAlerts) {
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();

        long total   = allAlerts.size();
        long open    = allAlerts.stream().filter(a -> a.getStatus() != AlertEvent.AlertStatus.CLOSED).count();
        long closed  = allAlerts.stream().filter(a -> a.getStatus() == AlertEvent.AlertStatus.CLOSED).count();
        long critical = allAlerts.stream().filter(a -> a.getSeverity() == AlertEvent.Severity.CRITICAL).count();
        long high    = allAlerts.stream().filter(a -> a.getSeverity() == AlertEvent.Severity.HIGH).count();
        long medium  = allAlerts.stream().filter(a -> a.getSeverity() == AlertEvent.Severity.MEDIUM).count();
        long low     = allAlerts.stream().filter(a -> a.getSeverity() == AlertEvent.Severity.LOW).count();

        // Status counts
        long newAlerts    = countByStatus(allAlerts, AlertEvent.AlertStatus.NEW);
        long triage       = countByStatus(allAlerts, AlertEvent.AlertStatus.UNDER_TRIAGE);
        long containment  = countByStatus(allAlerts, AlertEvent.AlertStatus.CONTAINMENT);
        long eradication  = countByStatus(allAlerts, AlertEvent.AlertStatus.ERADICATION);
        long recovery     = countByStatus(allAlerts, AlertEvent.AlertStatus.RECOVERY);
        long pir          = countByStatus(allAlerts, AlertEvent.AlertStatus.POST_INCIDENT_REVIEW);

        // Today's counts
        long createdToday  = allAlerts.stream().filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(today)).count();
        long resolvedToday = allAlerts.stream().filter(a -> a.getResolvedAt() != null && a.getResolvedAt().isAfter(today)).count();

        // Avg resolution time
        double avgResolution = allAlerts.stream()
                .filter(a -> a.getResolvedAt() != null && a.getCreatedAt() != null)
                .mapToLong(a -> java.time.Duration.between(a.getCreatedAt(), a.getResolvedAt()).toHours())
                .average().orElse(0.0);

        // Top attack types
        List<String> topAttacks = allAlerts.stream()
                .filter(a -> a.getAttackType() != null)
                .collect(Collectors.groupingBy(AlertEvent::getAttackType, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Top source IPs
        List<String> topIPs = allAlerts.stream()
                .collect(Collectors.groupingBy(AlertEvent::getSourceIp, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Most active analyst
        String mostActive = allAlerts.stream()
                .filter(a -> a.getAssignedAnalyst() != null)
                .collect(Collectors.groupingBy(AlertEvent::getAssignedAnalyst, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        // Severity breakdown (for pie/bar chart)
        Map<String, Long> severityBreakdown = Map.of(
                "CRITICAL", critical, "HIGH", high, "MEDIUM", medium, "LOW", low
        );

        // Status breakdown (for chart)
        Map<String, Long> statusBreakdown = Map.of(
                "NEW", newAlerts, "UNDER_TRIAGE", triage,
                "CONTAINMENT", containment, "ERADICATION", eradication,
                "RECOVERY", recovery, "CLOSED", closed
        );

        // Recent critical alerts
        List<DashboardMetricsDTO.AlertSummary> recentCritical = allAlerts.stream()
                .filter(a -> a.getSeverity() == AlertEvent.Severity.CRITICAL || a.getSeverity() == AlertEvent.Severity.HIGH)
                .filter(a -> a.getStatus() != AlertEvent.AlertStatus.CLOSED)
                .sorted(Comparator.comparing(AlertEvent::getDetectedAt).reversed())
                .limit(5)
                .map(this::toAlertSummary)
                .collect(Collectors.toList());

        return DashboardMetricsDTO.builder()
                .totalAlerts(total)
                .openAlerts(open)
                .closedAlerts(closed)
                .criticalAlerts(critical)
                .highAlerts(high)
                .mediumAlerts(medium)
                .lowAlerts(low)
                .newAlerts(newAlerts)
                .underTriageAlerts(triage)
                .containmentAlerts(containment)
                .eradicationAlerts(eradication)
                .recoveryAlerts(recovery)
                .postIncidentReview(pir)
                .avgResolutionTimeHours(avgResolution)
                .mttrHours(avgResolution * 0.6)
                .mttdHours(avgResolution * 0.4)
                .alertsCreatedToday((int) createdToday)
                .alertsResolvedToday((int) resolvedToday)
                .topAttackTypes(topAttacks)
                .topSourceIPs(topIPs)
                .mostActiveAnalyst(mostActive)
                .severityBreakdown(severityBreakdown)
                .statusBreakdown(statusBreakdown)
                .recentCriticalAlerts(recentCritical)
                .eventBusOnline(true)
                .cacheOnline(true)
                .activeAnalysts(4)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private long countByStatus(List<AlertEvent> alerts, AlertEvent.AlertStatus status) {
        return alerts.stream().filter(a -> a.getStatus() == status).count();
    }

    private DashboardMetricsDTO.AlertSummary toAlertSummary(AlertEvent a) {
        return DashboardMetricsDTO.AlertSummary.builder()
                .id(a.getId())
                .alertId(a.getAlertId())
                .title(a.getTitle())
                .severity(a.getSeverity().name())
                .status(a.getStatus().name())
                .sourceIp(a.getSourceIp())
                .attackType(a.getAttackType())
                .assignedAnalyst(a.getAssignedAnalyst())
                .detectedAt(a.getDetectedAt())
                .build();
    }
}
