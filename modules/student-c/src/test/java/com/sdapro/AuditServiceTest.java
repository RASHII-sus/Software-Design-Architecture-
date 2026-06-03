package com.sdapro;

import com.sdapro.model.AuditLog;
import com.sdapro.model.AuditLogRepository;
import com.sdapro.service.AuditService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AuditServiceTest - Unit tests for Audit & Compliance Service.
 * Tests: factory methods, compliance report generation, query delegation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuditService Unit Tests - Student C")
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditService auditService;

    // =========================================================
    // TEST 1: Factory method creates correct alert audit log
    // =========================================================
    @Test
    @DisplayName("TC-08: logAlertAction() creates and saves AuditLog with correct fields")
    void testLogAlertAction_savesCorrectEntity() {
        AuditLog savedLog = buildLog("ALERT_ACTION", "CREATE", "analyst.ahmed",
                                      "ALERT-001", AuditLog.ComplianceFlag.NONE);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(savedLog);

        AuditLog result = auditService.logAlertAction(
                "CREATE", "ALERT-001", "analyst.ahmed", "Alert created", "10.0.0.1");

        assertThat(result).isNotNull();
        assertThat(result.getEventType()).isEqualTo("ALERT_ACTION");
        assertThat(result.getAction()).isEqualTo("CREATE");
        assertThat(result.getPerformedBy()).isEqualTo("analyst.ahmed");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    // =========================================================
    // TEST 2: Factory method for user access sets GDPR flag
    // =========================================================
    @Test
    @DisplayName("TC-09: logUserAccess() sets GDPR compliance flag")
    void testLogUserAccess_setsGdprFlag() {
        AuditLog savedLog = buildLog("USER_ACCESS", "ACCESS", "user1",
                                      "dashboard", AuditLog.ComplianceFlag.GDPR);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(savedLog);

        AuditLog result = auditService.logUserAccess(
                "ACCESS", "user1", "dashboard", "192.168.1.1");

        assertThat(result.getComplianceFlag()).isEqualTo(AuditLog.ComplianceFlag.GDPR);
    }

    // =========================================================
    // TEST 3: Compliance report returns correct structure
    // =========================================================
    @Test
    @DisplayName("TC-10: generateComplianceReport() returns map with required keys")
    void testGenerateComplianceReport_hasRequiredKeys() {
        LocalDateTime from = LocalDateTime.now().minusDays(30);
        LocalDateTime to = LocalDateTime.now();

        List<AuditLog> logs = List.of(
            buildLog("ALERT_ACTION", "CREATE", "analyst.ahmed", "ALERT-001", AuditLog.ComplianceFlag.NONE),
            buildLog("USER_ACCESS",  "ACCESS", "analyst.sara",  "dashboard",  AuditLog.ComplianceFlag.GDPR),
            buildLog("ALERT_ACTION", "ESCALATE","analyst.omar", "ALERT-002", AuditLog.ComplianceFlag.ISO27001)
        );
        when(auditLogRepository.findByTimestampBetween(from, to)).thenReturn(logs);

        Map<String, Object> report = auditService.generateComplianceReport(from, to);

        assertThat(report).containsKeys(
                "reportTitle", "totalEvents", "byComplianceFramework",
                "byAction", "byUser", "status"
        );
        assertThat(report.get("totalEvents")).isEqualTo(3);
        assertThat(report.get("status")).isEqualTo("COMPLIANT");
    }

    // =========================================================
    // TEST 4: getLogsByUser delegates to repository correctly
    // =========================================================
    @Test
    @DisplayName("TC-11: getLogsByUser() delegates to repository and returns list")
    void testGetLogsByUser_delegatesCorrectly() {
        List<AuditLog> logs = List.of(
            buildLog("ALERT_ACTION", "CREATE", "analyst.ahmed", "ALERT-001", AuditLog.ComplianceFlag.NONE)
        );
        when(auditLogRepository.findByPerformedByOrderByTimestampDesc("analyst.ahmed")).thenReturn(logs);

        List<AuditLog> result = auditService.getLogsByUser("analyst.ahmed");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPerformedBy()).isEqualTo("analyst.ahmed");
        verify(auditLogRepository).findByPerformedByOrderByTimestampDesc("analyst.ahmed");
    }

    // =========================================================
    // TEST 5: System event log uses SYSTEM as performer
    // =========================================================
    @Test
    @DisplayName("TC-12: logSystemEvent() sets performedBy=SYSTEM and action=SYSTEM")
    void testLogSystemEvent_setsSystemFields() {
        AuditLog savedLog = buildLog("STARTUP", "SYSTEM", "SYSTEM", null, AuditLog.ComplianceFlag.NONE);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(savedLog);

        AuditLog result = auditService.logSystemEvent("STARTUP", "Application started");

        assertThat(result.getPerformedBy()).isEqualTo("SYSTEM");
        assertThat(result.getAction()).isEqualTo("SYSTEM");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private AuditLog buildLog(String eventType, String action, String performedBy,
                               String entityId, AuditLog.ComplianceFlag flag) {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setEventType(eventType);
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setTargetEntityId(entityId);
        log.setComplianceFlag(flag);
        log.setTimestamp(LocalDateTime.now());
        return log;
    }
}
