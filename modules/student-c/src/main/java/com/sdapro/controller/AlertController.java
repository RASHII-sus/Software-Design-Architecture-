package com.sdapro.controller;

import com.sdapro.dto.AlertEventDTO;
import com.sdapro.model.AlertEvent;
import com.sdapro.model.AlertEventRepository;
import com.sdapro.orchestration.SOAOrchestrator;
import com.sdapro.service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AlertController - REST API for alert lifecycle management.
 *
 * Architecture: MVC (Controller layer)
 * Base URL: /api/alerts
 *
 * All new alerts pass through SOAOrchestrator (6-step pipeline).
 */
@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertEventRepository alertEventRepository;
    private final SOAOrchestrator soaOrchestrator;
    private final AuditService auditService;

    /**
     * POST /api/alerts
     * Ingest a new alert. Triggers full SOA orchestration pipeline.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN', 'INGESTION_SERVICE')")
    public ResponseEntity<AlertEventDTO> createAlert(@Valid @RequestBody AlertEventDTO dto) {
        log.info("[AlertController] POST /alerts - ingesting alert: {}", dto.getTitle());

        AlertEvent alert = dto.toEntity();
        AlertEvent orchestrated = soaOrchestrator.orchestrate(alert);

        auditService.logAlertAction("CREATE", orchestrated.getAlertId(),
                "API", "New alert created via REST API", null);

        return ResponseEntity.status(HttpStatus.CREATED).body(AlertEventDTO.fromEntity(orchestrated));
    }

    /**
     * GET /api/alerts
     * Get all alerts.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AlertEventDTO>> getAllAlerts() {
        List<AlertEventDTO> alerts = alertEventRepository.findAll()
                .stream().map(AlertEventDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    /**
     * GET /api/alerts/{id}
     * Get a specific alert by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<AlertEventDTO> getAlert(@PathVariable Long id) {
        return alertEventRepository.findById(id)
                .map(AlertEventDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/alerts/status/{status}
     * Get alerts by lifecycle status.
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AlertEventDTO>> getByStatus(@PathVariable String status) {
        AlertEvent.AlertStatus alertStatus = AlertEvent.AlertStatus.valueOf(status.toUpperCase());
        List<AlertEventDTO> alerts = alertEventRepository.findByStatus(alertStatus)
                .stream().map(AlertEventDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    /**
     * GET /api/alerts/open-priority
     * Get all open alerts sorted by priority (severity + detection time).
     */
    @GetMapping("/open-priority")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<List<AlertEventDTO>> getOpenPriority() {
        List<AlertEventDTO> alerts = alertEventRepository.findAllOpenSortedByPriority()
                .stream().map(AlertEventDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    /**
     * PUT /api/alerts/{id}/escalate?status=CONTAINMENT
     * Escalate alert to next lifecycle status via SOA Orchestrator.
     */
    @PutMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<AlertEventDTO> escalateAlert(
            @PathVariable Long id,
            @RequestParam String status) {

        AlertEvent.AlertStatus newStatus = AlertEvent.AlertStatus.valueOf(status.toUpperCase());
        AlertEvent escalated = soaOrchestrator.escalate(id, newStatus);

        auditService.logAlertAction("ESCALATE", escalated.getAlertId(),
                "API", "Alert escalated to " + status, null);

        return ResponseEntity.ok(AlertEventDTO.fromEntity(escalated));
    }

    /**
     * PUT /api/alerts/{id}/resolve
     * Resolve and close an alert.
     */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SOC_ANALYST', 'SOC_MANAGER', 'ADMIN')")
    public ResponseEntity<AlertEventDTO> resolveAlert(@PathVariable Long id) {
        AlertEvent resolved = soaOrchestrator.resolve(id);

        auditService.logAlertAction("RESOLVE", resolved.getAlertId(),
                "API", "Alert resolved and closed", null);

        return ResponseEntity.ok(AlertEventDTO.fromEntity(resolved));
    }

    /**
     * DELETE /api/alerts/{id}
     * Delete an alert (admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
        if (!alertEventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        alertEventRepository.deleteById(id);
        auditService.logAlertAction("DELETE", id.toString(), "ADMIN", "Alert deleted", null);
        return ResponseEntity.noContent().build();
    }
}
