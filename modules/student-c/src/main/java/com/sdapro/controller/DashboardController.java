package com.sdapro.controller;

import com.sdapro.dto.DashboardMetricsDTO;
import com.sdapro.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * DashboardController - REST API layer for SOC Dashboard.
 *
 * Architecture: MVC (Controller layer)
 * Base URL: /api/dashboard
 *
 * Endpoints:
 *   GET  /api/dashboard/metrics              → full dashboard metrics
 *   GET  /api/dashboard/metrics/{severity}   → filtered by severity
 *   GET  /api/dashboard/critical             → top 10 critical/high open alerts
 *   POST /api/dashboard/refresh              → force cache eviction + refresh
 *   GET  /api/dashboard/health               → system health check
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard/metrics
     * Returns full SOC dashboard metrics (cached, Redis 5min TTL).
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<DashboardMetricsDTO> getMetrics() {
        log.info("[DashboardController] GET /metrics");
        return ResponseEntity.ok(dashboardService.getMetrics());
    }

    /**
     * GET /api/dashboard/metrics/{severity}
     * Returns metrics filtered by severity level: LOW | MEDIUM | HIGH | CRITICAL
     */
    @GetMapping("/metrics/{severity}")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<DashboardMetricsDTO> getMetricsBySeverity(@PathVariable String severity) {
        log.info("[DashboardController] GET /metrics/{}", severity);
        return ResponseEntity.ok(dashboardService.getMetricsBySeverity(severity));
    }

    /**
     * GET /api/dashboard/critical
     * Returns top 10 open CRITICAL and HIGH alerts for priority widget.
     */
    @GetMapping("/critical")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<DashboardMetricsDTO.AlertSummary>> getCriticalAlerts() {
        log.info("[DashboardController] GET /critical");
        return ResponseEntity.ok(dashboardService.getCriticalAlerts());
    }

    /**
     * POST /api/dashboard/refresh
     * Forces cache eviction and returns fresh metrics.
     * Triggers WebSocket push to all connected dashboard clients.
     */
    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<DashboardMetricsDTO> refreshDashboard() {
        log.info("[DashboardController] POST /refresh - forcing cache refresh");
        return ResponseEntity.ok(dashboardService.refreshMetrics());
    }

    /**
     * GET /api/dashboard/health
     * System health check for event bus, cache, and SOC services.
     */
    @GetMapping("/health")
    public ResponseEntity<?> getHealth() {
        return ResponseEntity.ok(java.util.Map.of(
                "status", "UP",
                "service", "SOC Dashboard",
                "student", "Student C - SOC Platform Engineer",
                "timestamp", java.time.LocalDateTime.now()
        ));
    }
}
