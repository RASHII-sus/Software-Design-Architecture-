package com.sdapro.enrichment.controllers;

import com.sdapro.enrichment.domain.EnrichmentResultEntity;
import com.sdapro.enrichment.repositories.EnrichmentResultRepository;
import com.sdapro.enrichment.services.EnrichmentOrchestrationService;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for enrichment and correlation endpoints.
 */
@RestController
@RequestMapping("/api/v1")
public class EnrichmentController {

    private final EnrichmentOrchestrationService orchestrationService;
    private final EnrichmentResultRepository resultRepository;

    public EnrichmentController(EnrichmentOrchestrationService orchestrationService,
                                 EnrichmentResultRepository resultRepository) {
        this.orchestrationService = orchestrationService;
        this.resultRepository = resultRepository;
    }

    /** POST /api/v1/enrich — Enrich a single alert. */
    @PostMapping("/enrich")
    public ResponseEntity<EnrichmentResult> enrichAlert(@RequestBody CanonicalAlert alert) {
        EnrichmentResult result = orchestrationService.enrichAlert(alert);
        return ResponseEntity.ok(result);
    }

    /** POST /api/v1/enrich/batch — Enrich and correlate a batch of alerts. */
    @PostMapping("/enrich/batch")
    public ResponseEntity<Map<String, Object>> enrichBatch(@RequestBody List<CanonicalAlert> alerts) {
        CorrelationResult correlation = orchestrationService.enrichAndCorrelate(alerts);
        return ResponseEntity.ok(Map.of(
            "alertCount", alerts.size(),
            "correlationAction", correlation.getAction().name(),
            "correlationRule", correlation.getCorrelationRule(),
            "confidence", correlation.getConfidenceScore(),
            "summary", correlation.getSummary() != null ? correlation.getSummary() : ""
        ));
    }

    /** GET /api/v1/enrichment-results/{alertId} — Get enrichment result for an alert. */
    @GetMapping("/enrichment-results/{alertId}")
    public ResponseEntity<EnrichmentResultEntity> getResult(@PathVariable UUID alertId) {
        return resultRepository.findByAlertId(alertId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/v1/enrichment-results — List all enrichment results. */
    @GetMapping("/enrichment-results")
    public ResponseEntity<List<EnrichmentResultEntity>> getAllResults() {
        return ResponseEntity.ok(resultRepository.findAll());
    }
}
