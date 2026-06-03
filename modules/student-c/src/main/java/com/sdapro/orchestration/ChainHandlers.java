package com.sdapro.orchestration;

import com.sdapro.model.AlertEvent;
import com.sdapro.model.AlertEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

// =============================================================
// CHAIN OF RESPONSIBILITY: 6 SOA pipeline step handlers
// Each is a @Component bean and handles one step of the workflow
// =============================================================

/**
 * Step 1 - Ingest: persist the alert to database
 */
@Component
@Slf4j
@RequiredArgsConstructor
class AlertIngestionHandler {
    private final AlertEventRepository repo;

    public void handle(OrchestrationContext ctx) {
        AlertEvent alert = ctx.getAlert();
        if (alert.getAlertId() == null) {
            alert.setAlertId("ALERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        alert.setStatus(AlertEvent.AlertStatus.NEW);
        AlertEvent saved = repo.save(alert);
        ctx.setAlert(saved);
        ctx.addLog("INGEST: Alert persisted with ID " + saved.getId());
        log.debug("[INGEST] Alert saved: {}", saved.getAlertId());
    }
}

/**
 * Step 2 - Enrichment: MITRE ATT&CK mapping, threat intel lookup
 *
 * Design Pattern: Strategy Pattern
 *   - Different enrichment logic based on attackType
 */
@Component
@Slf4j
class AlertEnrichmentHandler {

    // PATTERN: Strategy
    // RATIONALE: Enrichment rules vary by attack type and map alerts to different MITRE categories.

    // MITRE ATT&CK ID mapping by attack type (simplified)
    private static final Map<String, String> MITRE_MAP = Map.of(
        "PHISHING",          "T1566",
        "RANSOMWARE",        "T1486",
        "BRUTE_FORCE",       "T1110",
        "SQL_INJECTION",     "T1190",
        "PRIVILEGE_ESCALATION", "T1068",
        "LATERAL_MOVEMENT",  "T1021",
        "DATA_EXFILTRATION", "T1041",
        "DDOS",              "T1498"
    );

    public void handle(OrchestrationContext ctx) {
        AlertEvent alert = ctx.getAlert();

        // Strategy: map attack type to MITRE ATT&CK
        if (alert.getAttackType() != null) {
            String mitreId = MITRE_MAP.getOrDefault(alert.getAttackType().toUpperCase(), "T0000");
            ctx.setMitreAttackId(mitreId);
            ctx.setEnrichedAttackCategory(classifyAttack(alert.getAttackType()));
        }

        // Simulate geo-lookup of source IP
        ctx.setGeoLocation(simulateGeoLookup(alert.getSourceIp()));
        ctx.setEnriched(true);
        ctx.addLog("ENRICH: MITRE=" + ctx.getMitreAttackId() + ", Geo=" + ctx.getGeoLocation());
        log.debug("[ENRICH] Alert {} enriched", alert.getAlertId());
    }

    private String classifyAttack(String attackType) {
        return switch (attackType.toUpperCase()) {
            case "PHISHING", "SOCIAL_ENGINEERING" -> "Initial Access";
            case "RANSOMWARE", "MALWARE" -> "Impact";
            case "BRUTE_FORCE", "CREDENTIAL_STUFFING" -> "Credential Access";
            case "SQL_INJECTION", "XSS" -> "Exploitation";
            case "LATERAL_MOVEMENT", "PASS_THE_HASH" -> "Lateral Movement";
            case "DATA_EXFILTRATION" -> "Exfiltration";
            default -> "Unknown";
        };
    }

    private String simulateGeoLookup(String ip) {
        if (ip == null) return "Unknown";
        // Simulated geo lookup (replace with real MaxMind / IP-API integration)
        if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) return "Internal";
        return "External-" + ip.substring(0, Math.min(ip.length(), 5));
    }
}

/**
 * Step 3 - Correlation: group related alerts into incidents
 */
@Component
@Slf4j
@RequiredArgsConstructor
class AlertCorrelationHandler {
    private final AlertEventRepository repo;

    public void handle(OrchestrationContext ctx) {
        AlertEvent alert = ctx.getAlert();

        // Find related open alerts from same source IP
        List<AlertEvent> relatedAlerts = repo.findByDetectedAtBetween(
                alert.getDetectedAt().minusHours(1),
                alert.getDetectedAt().plusHours(1)
        ).stream()
         .filter(a -> a.getSourceIp().equals(alert.getSourceIp()) && !a.getId().equals(alert.getId()))
         .toList();

        if (!relatedAlerts.isEmpty()) {
            String incidentId = "INC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            ctx.setCorrelatedIncidentId(incidentId);
            ctx.setCorrelated(true);
            ctx.addLog("CORRELATE: Grouped with " + relatedAlerts.size() + " alerts into incident " + incidentId);
        } else {
            ctx.addLog("CORRELATE: No related alerts found, standalone alert");
        }

        log.debug("[CORRELATE] Alert {} correlated={}", alert.getAlertId(), ctx.isCorrelated());
    }
}

/**
 * Step 4 - Triage: compute priority score 1-100
 *
 * Design Pattern: Strategy - scoring strategy varies by severity
 */
@Component
@Slf4j
class AlertTriageHandler {

    public void handle(OrchestrationContext ctx) {
        AlertEvent alert = ctx.getAlert();
        int score = calculatePriorityScore(alert, ctx);
        ctx.setPriorityScore(score);
        alert.setStatus(AlertEvent.AlertStatus.UNDER_TRIAGE);
        ctx.addLog("TRIAGE: Priority score=" + score);
        log.debug("[TRIAGE] Alert {} priority={}", alert.getAlertId(), score);
    }

    private int calculatePriorityScore(AlertEvent alert, OrchestrationContext ctx) {
        int score = 0;

        // Severity weight (Strategy Pattern: different scoring per severity)
        score += switch (alert.getSeverity()) {
            case CRITICAL -> 50;
            case HIGH     -> 35;
            case MEDIUM   -> 20;
            case LOW      -> 10;
        };

        // Correlation bonus: correlated = more impactful
        if (ctx.isCorrelated()) score += 20;

        // External IP = higher risk
        if (ctx.getGeoLocation() != null && !ctx.getGeoLocation().equals("Internal")) score += 15;

        // Ransomware / data exfiltration = business impact bonus
        if (alert.getAttackType() != null) {
            String type = alert.getAttackType().toUpperCase();
            if (type.contains("RANSOMWARE") || type.contains("EXFIL")) score += 15;
        }

        return Math.min(score, 100); // cap at 100
    }
}

/**
 * Step 5 - Assignment: auto-assign alert to least-loaded analyst
 */
@Component
@Slf4j
@RequiredArgsConstructor
class AlertAssignmentHandler {
    private final AlertEventRepository repo;

    // Pool of available SOC analysts
    private static final List<String> ANALYSTS = List.of(
            "analyst.ahmed", "analyst.sara", "analyst.omar", "analyst.fatima"
    );

    public void handle(OrchestrationContext ctx) {
        AlertEvent alert = ctx.getAlert();

        if (alert.getAssignedAnalyst() == null) {
            // Load-balance: assign to analyst with fewest open alerts
            String analyst = ANALYSTS.stream()
                    .min((a, b) -> Long.compare(
                            repo.findByAssignedAnalyst(a).stream().filter(x -> x.getStatus() != AlertEvent.AlertStatus.CLOSED).count(),
                            repo.findByAssignedAnalyst(b).stream().filter(x -> x.getStatus() != AlertEvent.AlertStatus.CLOSED).count()
                    ))
                    .orElse(ANALYSTS.get(0));

            alert.setAssignedAnalyst(analyst);
            ctx.setAssigned(true);
            ctx.addLog("ASSIGN: Auto-assigned to " + analyst);
            log.debug("[ASSIGN] Alert {} assigned to {}", alert.getAlertId(), analyst);
        } else {
            ctx.addLog("ASSIGN: Already assigned to " + alert.getAssignedAnalyst());
        }
    }
}

/**
 * Step 6 - Notification: push alert to SOC dashboard and analyst
 */
@Component
@Slf4j
class AlertNotificationHandler {

    public void handle(OrchestrationContext ctx) {
        AlertEvent alert = ctx.getAlert();

        // Log what would be sent (WebSocket push handled by DashboardService observer)
        ctx.addLog("NOTIFY: Dashboard refreshed, analyst notified: " + alert.getAssignedAnalyst());
        log.info("[NOTIFY] Alert {} notification dispatched. Pipeline complete in {} steps.",
                alert.getAlertId(), ctx.getProcessingLog().size());
    }
}
