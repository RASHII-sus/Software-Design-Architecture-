package com.sdapro.alertingestion.controllers;

import com.sdapro.alertingestion.config.IngestionConfigManager;
import com.sdapro.alertingestion.domain.alert.AlertCampaign;
import com.sdapro.alertingestion.domain.alert.SingleAlert;
import com.sdapro.alertingestion.repositories.AlertCampaignRepository;
import com.sdapro.alertingestion.repositories.AlertRepository;
import com.sdapro.alertingestion.services.ingestion.AlertIngestionOrchestrator;
import com.sdapro.alertingestion.services.ingestion.PollingIngestionService;
import com.sdapro.shared.commons.AlertSourceType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for alert ingestion endpoints.
 * Supports webhook-based (push) alert ingestion and alert querying.
 */
@RestController
@RequestMapping("/api/v1")
public class AlertIngestionController {

    private final AlertIngestionOrchestrator orchestrator;
    private final PollingIngestionService pollingIngestionService;
    private final AlertRepository alertRepository;
    private final AlertCampaignRepository campaignRepository;

    public AlertIngestionController(AlertIngestionOrchestrator orchestrator,
                                     PollingIngestionService pollingIngestionService,
                                     AlertRepository alertRepository,
                                     AlertCampaignRepository campaignRepository) {
        this.orchestrator = orchestrator;
        this.pollingIngestionService = pollingIngestionService;
        this.alertRepository = alertRepository;
        this.campaignRepository = campaignRepository;
    }

    /**
     * POST /api/v1/ingest/{sourceType} — Ingest a single alert via webhook.
     * The raw JSON body is the alert payload from the external source.
     */
    @PostMapping("/ingest/{sourceType}")
    public ResponseEntity<Map<String, Object>> ingestAlert(
            @PathVariable String sourceType,
            @RequestBody String rawPayload) {
        try {
            AlertSourceType type = AlertSourceType.valueOf(sourceType.toUpperCase());
            SingleAlert alert = orchestrator.ingestAlert(type, rawPayload);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "ingested",
                "alertId", alert.getId().toString(),
                "title", alert.getTitle(),
                "severity", alert.getSeverity().name(),
                "sourceType", type.name()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid source type or normalization error: " + e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/v1/poll/{sourceType} — Pull alerts from an API-backed source.
     * Demonstrates the pull/polling ingestion mode required by the project charter.
     */
    @PostMapping("/poll/{sourceType}")
    public ResponseEntity<Map<String, Object>> pollSource(
            @PathVariable String sourceType,
            @RequestParam(defaultValue = "1") int batchSize) {
        try {
            AlertSourceType type = AlertSourceType.valueOf(sourceType.toUpperCase());
            List<SingleAlert> alerts = pollingIngestionService.pollSource(type, batchSize);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "polled",
                "sourceType", type.name(),
                "count", alerts.size(),
                "alertIds", alerts.stream().map(a -> a.getId().toString()).toList()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v1/ingest/{sourceType}/campaign — Ingest multiple alerts as a campaign.
     */
    @PostMapping("/ingest/{sourceType}/campaign")
    public ResponseEntity<Map<String, Object>> ingestCampaign(
            @PathVariable String sourceType,
            @RequestBody CampaignIngestionRequest request) {
        try {
            AlertSourceType type = AlertSourceType.valueOf(sourceType.toUpperCase());
            AlertCampaign campaign = orchestrator.ingestAndGroupCampaign(
                type, request.payloads, request.campaignName, request.attackPattern
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "campaign_created",
                "campaignId", campaign.getId().toString(),
                "campaignName", campaign.getCampaignName(),
                "alertCount", campaign.getChildAlertIds().size(),
                "maxSeverity", campaign.getMaxSeverity().name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/v1/alerts — List all alerts. */
    @GetMapping("/alerts")
    public ResponseEntity<List<SingleAlert>> getAllAlerts() {
        return ResponseEntity.ok(alertRepository.findAll());
    }

    /** GET /api/v1/alerts/{id} — Get alert by ID. */
    @GetMapping("/alerts/{id}")
    public ResponseEntity<SingleAlert> getAlertById(@PathVariable UUID id) {
        return alertRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/v1/alerts/campaigns — List all campaigns. */
    @GetMapping("/alerts/campaigns")
    public ResponseEntity<List<AlertCampaign>> getAllCampaigns() {
        return ResponseEntity.ok(campaignRepository.findAll());
    }

    /** GET /api/v1/alerts/campaigns/{id} — Get campaign by ID. */
    @GetMapping("/alerts/campaigns/{id}")
    public ResponseEntity<AlertCampaign> getCampaignById(@PathVariable UUID id) {
        return campaignRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/v1/config — Get current ingestion configuration.
     * Demonstrates Singleton pattern access.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        // PATTERN: Singleton — accessing the shared config instance
        IngestionConfigManager config = IngestionConfigManager.getInstance();
        return ResponseEntity.ok(Map.of(
            "configs", config.getAllConfigs()
        ));
    }

    /** Request DTO for campaign ingestion. */
    public static class CampaignIngestionRequest {
        public String campaignName;
        public String attackPattern;
        public List<String> payloads;
    }
}
