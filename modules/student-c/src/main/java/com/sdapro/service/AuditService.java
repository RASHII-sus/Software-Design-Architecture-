package com.sdapro.service;

import com.sdapro.model.AuditLog;
import com.sdapro.model.AuditLog.ComplianceFlag;
import com.sdapro.model.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AuditService - manages all audit logging and compliance reporting.
 *
 * Design Patterns:
 *   - Factory Pattern: createAuditLog() factory method creates correct log type
 *   - Facade: generateComplianceReport() hides all aggregation complexity
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuditService {

    // PATTERN: Factory Method
    // RATIONALE: Public logging methods create specialized AuditLog records for alert, user, and system events.

    private final AuditLogRepository auditLogRepository;

    // =========================================================
    // FACTORY PATTERN: Create specific audit log types
    // =========================================================

    /**
     * FACTORY METHOD: Create an alert-related audit log entry.
     */
    public AuditLog logAlertAction(String action, String alertId, String performedBy,
                                    String details, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .eventType("ALERT_ACTION")
                .action(action)
                .performedBy(performedBy)
                .targetEntityId(alertId)
                .targetEntityType("AlertEvent")
                .details(details)
                .ipAddress(ipAddress)
                .complianceFlag(determineComplianceFlag("ALERT_ACTION", action))
                .timestamp(LocalDateTime.now())
                .build();
        return auditLogRepository.save(log);
    }

    /**
     * FACTORY METHOD: Create a user access audit log entry.
     */
    public AuditLog logUserAccess(String action, String userId, String resource, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .eventType("USER_ACCESS")
                .action(action)
                .performedBy(userId)
                .targetEntityId(resource)
                .targetEntityType("User")
                .details("Access to " + resource)
                .ipAddress(ipAddress)
                .complianceFlag(ComplianceFlag.GDPR)
                .timestamp(LocalDateTime.now())
                .build();
        return auditLogRepository.save(log);
    }

    /**
     * FACTORY METHOD: Create a system event audit log.
     */
    public AuditLog logSystemEvent(String eventType, String details) {
        AuditLog log = AuditLog.builder()
                .eventType(eventType)
                .action("SYSTEM")
                .performedBy("SYSTEM")
                .details(details)
                .complianceFlag(ComplianceFlag.NONE)
                .timestamp(LocalDateTime.now())
                .build();
        return auditLogRepository.save(log);
    }

    // =========================================================
    // QUERY METHODS
    // =========================================================

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    public List<AuditLog> getLogsByUser(String user) {
        return auditLogRepository.findByPerformedByOrderByTimestampDesc(user);
    }

    public List<AuditLog> getLogsByAlert(String alertId) {
        return auditLogRepository.findByTargetEntityId(alertId);
    }

    public List<AuditLog> getLogsByCompliance(String flag) {
        return auditLogRepository.findByComplianceFlag(ComplianceFlag.valueOf(flag.toUpperCase()));
    }

    public List<AuditLog> getRecentLogs(int hours) {
        return auditLogRepository.findRecentLogs(LocalDateTime.now().minusHours(hours));
    }

    // =========================================================
    // FACADE: Compliance Report Generation
    // =========================================================

    /**
     * FACADE: generateComplianceReport() - single method returning full compliance report.
     */
    public Map<String, Object> generateComplianceReport(LocalDateTime from, LocalDateTime to) {
        List<AuditLog> logs = auditLogRepository.findByTimestampBetween(from, to);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("reportTitle", "SDA-Pro SOC Compliance Report");
        report.put("generatedAt", LocalDateTime.now().toString());
        report.put("periodFrom", from.toString());
        report.put("periodTo", to.toString());
        report.put("totalEvents", logs.size());

        // Breakdown by compliance flag
        Map<String, Long> byFlag = logs.stream()
                .collect(Collectors.groupingBy(l -> l.getComplianceFlag().name(), Collectors.counting()));
        report.put("byComplianceFramework", byFlag);

        // Breakdown by action type
        Map<String, Long> byAction = logs.stream()
                .collect(Collectors.groupingBy(AuditLog::getAction, Collectors.counting()));
        report.put("byAction", byAction);

        // Breakdown by user
        Map<String, Long> byUser = logs.stream()
                .collect(Collectors.groupingBy(AuditLog::getPerformedBy, Collectors.counting()));
        report.put("byUser", byUser);

        // Most common event types
        List<String> topEventTypes = logs.stream()
                .collect(Collectors.groupingBy(AuditLog::getEventType, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        report.put("topEventTypes", topEventTypes);

        // GDPR-specific section
        long gdprEvents = logs.stream().filter(l -> l.getComplianceFlag() == ComplianceFlag.GDPR).count();
        report.put("gdprEventsCount", gdprEvents);

        // ISO27001-specific section
        long isoEvents = logs.stream().filter(l -> l.getComplianceFlag() == ComplianceFlag.ISO27001).count();
        report.put("iso27001EventsCount", isoEvents);

        report.put("status", "COMPLIANT");

        log.info("[AuditService] Generated compliance report: {} events from {} to {}", logs.size(), from, to);
        return report;
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private ComplianceFlag determineComplianceFlag(String eventType, String action) {
        if ("DELETE".equals(action) || "ACCESS".equals(action)) return ComplianceFlag.GDPR;
        if ("ESCALATE".equals(action) || "INCIDENT".equals(eventType)) return ComplianceFlag.ISO27001;
        if ("EXPORT".equals(action)) return ComplianceFlag.SOC2;
        return ComplianceFlag.NONE;
    }
}
