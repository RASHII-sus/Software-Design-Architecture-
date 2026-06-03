package com.sdapro.controller;

import com.sdapro.model.AuditLog;
import com.sdapro.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AuditController - REST API for audit logs and compliance reports.
 *
 * Base URL: /api/audit
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuditController {

    private final AuditService auditService;

    /** GET /api/audit/logs - all audit logs (admin/manager only) */
    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditService.getAllLogs());
    }

    /** GET /api/audit/logs/user/{username} */
    @GetMapping("/logs/user/{username}")
    @PreAuthorize("hasAnyRole('SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AuditLog>> getByUser(@PathVariable String username) {
        return ResponseEntity.ok(auditService.getLogsByUser(username));
    }

    /** GET /api/audit/logs/alert/{alertId} */
    @GetMapping("/logs/alert/{alertId}")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AuditLog>> getByAlert(@PathVariable String alertId) {
        return ResponseEntity.ok(auditService.getLogsByAlert(alertId));
    }

    /** GET /api/audit/logs/compliance/{flag} - e.g. GDPR, ISO27001, SOC2 */
    @GetMapping("/logs/compliance/{flag}")
    @PreAuthorize("hasAnyRole('SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AuditLog>> getByComplianceFlag(@PathVariable String flag) {
        return ResponseEntity.ok(auditService.getLogsByCompliance(flag));
    }

    /** GET /api/audit/logs/recent?hours=24 */
    @GetMapping("/logs/recent")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AuditLog>> getRecentLogs(
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(auditService.getRecentLogs(hours));
    }

    /**
     * GET /api/audit/compliance-report?from=2024-01-01T00:00:00&to=2024-12-31T23:59:59
     * Generates a full compliance report for a time range.
     */
    @GetMapping("/compliance-report")
    @PreAuthorize("hasAnyRole('SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getComplianceReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        log.info("[AuditController] Generating compliance report: {} to {}", from, to);
        return ResponseEntity.ok(auditService.generateComplianceReport(from, to));
    }
}
