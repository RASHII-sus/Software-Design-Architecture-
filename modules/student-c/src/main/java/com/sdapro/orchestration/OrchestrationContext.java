package com.sdapro.orchestration;

import com.sdapro.model.AlertEvent;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * OrchestrationContext - shared context object passed through the
 * Chain of Responsibility pipeline.
 *
 * Each handler reads and writes to this context.
 * Design Pattern: Chain of Responsibility context carrier.
 */
@Data
@Builder
public class OrchestrationContext {
    private AlertEvent alert;
    private LocalDateTime startTime;

    @Builder.Default
    private List<String> processingLog = new ArrayList<>();

    @Builder.Default
    private boolean enriched = false;

    @Builder.Default
    private boolean correlated = false;

    @Builder.Default
    private boolean assigned = false;

    private String correlatedIncidentId;
    private String enrichedAttackCategory;
    private String mitreAttackId;
    private String geoLocation;
    private int priorityScore;       // 1-100, computed during triage

    public void addLog(String message) {
        processingLog.add(LocalDateTime.now() + " - " + message);
    }
}
