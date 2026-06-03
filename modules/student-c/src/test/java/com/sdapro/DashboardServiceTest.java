package com.sdapro;

import com.sdapro.dto.DashboardMetricsDTO;
import com.sdapro.model.AlertEvent;
import com.sdapro.model.AlertEventRepository;
import com.sdapro.event.EventBus;
import com.sdapro.service.DashboardService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * DashboardServiceTest - Unit tests for SOC Dashboard Service.
 * Tests: metrics computation, Observer registration, WebSocket push, caching.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService Unit Tests - Student C")
class DashboardServiceTest {

    @Mock
    private AlertEventRepository alertEventRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private EventBus eventBus;

    @InjectMocks
    private DashboardService dashboardService;

    private List<AlertEvent> sampleAlerts;

    @BeforeEach
    void setUp() {
        sampleAlerts = List.of(
            buildAlert(1L, "ALERT-001", AlertEvent.Severity.CRITICAL, AlertEvent.AlertStatus.NEW,       "192.168.1.10", "RANSOMWARE"),
            buildAlert(2L, "ALERT-002", AlertEvent.Severity.HIGH,     AlertEvent.AlertStatus.UNDER_TRIAGE, "10.0.0.5",  "PHISHING"),
            buildAlert(3L, "ALERT-003", AlertEvent.Severity.MEDIUM,   AlertEvent.AlertStatus.CONTAINMENT,  "203.0.113.1","SQL_INJECTION"),
            buildAlert(4L, "ALERT-004", AlertEvent.Severity.LOW,      AlertEvent.AlertStatus.CLOSED,        "10.0.0.5",  "BRUTE_FORCE"),
            buildAlert(5L, "ALERT-005", AlertEvent.Severity.CRITICAL, AlertEvent.AlertStatus.ERADICATION,  "45.33.32.156","DDOS")
        );
    }

    // =========================================================
    // TEST 1: Metrics totals are computed correctly
    // =========================================================
    @Test
    @DisplayName("TC-01: getMetrics() returns correct total and open alert counts")
    void testGetMetrics_totalAndOpenCounts() {
        when(alertEventRepository.findAll()).thenReturn(sampleAlerts);

        DashboardMetricsDTO metrics = dashboardService.getMetrics();

        assertThat(metrics.getTotalAlerts()).isEqualTo(5);
        assertThat(metrics.getOpenAlerts()).isEqualTo(4);  // 4 non-closed
        assertThat(metrics.getClosedAlerts()).isEqualTo(1);
    }

    // =========================================================
    // TEST 2: Severity breakdown is correct
    // =========================================================
    @Test
    @DisplayName("TC-02: getMetrics() severity breakdown is accurate")
    void testGetMetrics_severityBreakdown() {
        when(alertEventRepository.findAll()).thenReturn(sampleAlerts);

        DashboardMetricsDTO metrics = dashboardService.getMetrics();

        assertThat(metrics.getCriticalAlerts()).isEqualTo(2);
        assertThat(metrics.getHighAlerts()).isEqualTo(1);
        assertThat(metrics.getMediumAlerts()).isEqualTo(1);
        assertThat(metrics.getLowAlerts()).isEqualTo(1);
    }

    // =========================================================
    // TEST 3: Severity breakdown map is populated
    // =========================================================
    @Test
    @DisplayName("TC-03: severityBreakdown map contains all 4 severity keys")
    void testGetMetrics_severityBreakdownMap() {
        when(alertEventRepository.findAll()).thenReturn(sampleAlerts);

        DashboardMetricsDTO metrics = dashboardService.getMetrics();

        assertThat(metrics.getSeverityBreakdown()).containsKeys("CRITICAL", "HIGH", "MEDIUM", "LOW");
        assertThat(metrics.getSeverityBreakdown().get("CRITICAL")).isEqualTo(2L);
    }

    // =========================================================
    // TEST 4: Empty alert list returns zero metrics
    // =========================================================
    @Test
    @DisplayName("TC-04: getMetrics() with no alerts returns all zeros")
    void testGetMetrics_emptyAlerts() {
        when(alertEventRepository.findAll()).thenReturn(List.of());

        DashboardMetricsDTO metrics = dashboardService.getMetrics();

        assertThat(metrics.getTotalAlerts()).isEqualTo(0);
        assertThat(metrics.getOpenAlerts()).isEqualTo(0);
        assertThat(metrics.getCriticalAlerts()).isEqualTo(0);
        assertThat(metrics.getRecentCriticalAlerts()).isEmpty();
    }

    // =========================================================
    // TEST 5: generatedAt timestamp is present
    // =========================================================
    @Test
    @DisplayName("TC-05: getMetrics() sets generatedAt timestamp")
    void testGetMetrics_generatedAtIsSet() {
        when(alertEventRepository.findAll()).thenReturn(sampleAlerts);
        LocalDateTime before = LocalDateTime.now().minusSeconds(1);

        DashboardMetricsDTO metrics = dashboardService.getMetrics();

        assertThat(metrics.getGeneratedAt()).isNotNull();
        assertThat(metrics.getGeneratedAt()).isAfter(before);
    }

    // =========================================================
    // TEST 6: Observer registers on EventBus at startup
    // =========================================================
    @Test
    @DisplayName("TC-06: registerAsObserver() subscribes to 4 event types on EventBus")
    void testRegisterAsObserver_subscribesCorrectly() {
        dashboardService.registerAsObserver();

        verify(eventBus, times(4)).subscribe(any(EventBus.EventType.class), any());
    }

    // =========================================================
    // TEST 7: refreshMetrics pushes to WebSocket
    // =========================================================
    @Test
    @DisplayName("TC-07: refreshMetrics() triggers WebSocket push to /topic/dashboard")
    void testRefreshMetrics_pushesToWebSocket() {
        when(alertEventRepository.findAll()).thenReturn(sampleAlerts);

        dashboardService.refreshMetrics();

        verify(messagingTemplate, atLeastOnce())
                .convertAndSend(eq("/topic/dashboard"), any(DashboardMetricsDTO.class));
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private AlertEvent buildAlert(Long id, String alertId, AlertEvent.Severity severity,
                                   AlertEvent.AlertStatus status, String sourceIp, String attackType) {
        AlertEvent a = new AlertEvent();
        a.setId(id);
        a.setAlertId(alertId);
        a.setTitle("Test Alert " + id);
        a.setSeverity(severity);
        a.setStatus(status);
        a.setSourceIp(sourceIp);
        a.setAttackType(attackType);
        a.setDetectedAt(LocalDateTime.now().minusHours(id));
        a.setCreatedAt(LocalDateTime.now().minusHours(id));
        return a;
    }
}
