package com.sdapro.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DashboardMetricsDTO - complete SOC dashboard data payload.
 * Sent to front-end via REST and via WebSocket for live updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDTO implements Serializable {

    // === Summary Counts ===
    private long totalAlerts;
    private long openAlerts;
    private long closedAlerts;
    private long criticalAlerts;
    private long highAlerts;
    private long mediumAlerts;
    private long lowAlerts;

    // === Lifecycle Status Counts ===
    private long newAlerts;
    private long underTriageAlerts;
    private long containmentAlerts;
    private long eradicationAlerts;
    private long recoveryAlerts;
    private long postIncidentReview;

    // === Performance KPIs ===
    private double avgResolutionTimeHours;
    private double mttrHours;           // Mean Time to Respond
    private double mttdHours;           // Mean Time to Detect
    private int alertsResolvedToday;
    private int alertsCreatedToday;

    // === Top Threats ===
    private List<String> topAttackTypes;
    private List<String> topSourceIPs;
    private String mostActiveAnalyst;

    // === Severity Breakdown (for chart) ===
    private Map<String, Long> severityBreakdown;   // {"CRITICAL":5,"HIGH":12,...}

    // === Status Breakdown (for chart) ===
    private Map<String, Long> statusBreakdown;

    // === Recent Critical Alerts (last 5) ===
    private List<AlertSummary> recentCriticalAlerts;

    // === System Health ===
    private boolean eventBusOnline;
    private boolean cacheOnline;
    private int activeAnalysts;

    // === Timestamp ===
    private LocalDateTime generatedAt;

    /**
     * Inner class: compact alert summary for dashboard list widget
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertSummary implements Serializable {
        private Long id;
        private String alertId;
        private String title;
        private String severity;
        private String status;
        private String sourceIp;
        private String attackType;
        private String assignedAnalyst;
        private LocalDateTime detectedAt;
    }
}
