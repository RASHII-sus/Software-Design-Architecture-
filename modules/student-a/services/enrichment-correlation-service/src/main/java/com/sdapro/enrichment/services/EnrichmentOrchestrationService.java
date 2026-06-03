package com.sdapro.enrichment.services;

import com.sdapro.enrichment.domain.EnrichmentResultEntity;
import com.sdapro.enrichment.repositories.EnrichmentResultRepository;
import com.sdapro.enrichment.services.pipeline.EnrichmentPipelineAssembler;
import com.sdapro.enrichment.services.strategy.CorrelationStrategy;
import com.sdapro.enrichment.services.strategy.CorrelationStrategySelector;
import com.sdapro.shared.commons.EnrichmentStatus;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;
import com.sdapro.shared.events.AlertEnrichedEvent;
import com.sdapro.shared.events.SimpleEventBus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Main orchestrator for the enrichment and correlation service.
 * Coordinates the Chain of Responsibility pipeline and Strategy-based correlation.
 */
@Service
public class EnrichmentOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(EnrichmentOrchestrationService.class);

    private final EnrichmentPipelineAssembler pipelineAssembler;
    private final CorrelationStrategySelector strategySelector;
    private final EnrichmentResultRepository resultRepository;

    public EnrichmentOrchestrationService(EnrichmentPipelineAssembler pipelineAssembler,
                                           CorrelationStrategySelector strategySelector,
                                           EnrichmentResultRepository resultRepository) {
        this.pipelineAssembler = pipelineAssembler;
        this.strategySelector = strategySelector;
        this.resultRepository = resultRepository;
    }

    /**
     * Enrich a single alert through the full pipeline.
     */
    public EnrichmentResult enrichAlert(CanonicalAlert alert) {
        log.info("Enriching alert: id={}, title={}", alert.getId(), alert.getTitle());

        // Execute the Chain of Responsibility pipeline
        EnrichmentResult result = pipelineAssembler.executePipeline(alert);
        result.setAlertId(alert.getId());

        // Persist result
        EnrichmentResultEntity entity = toEntity(result);
        resultRepository.save(entity);

        // Publish event
        SimpleEventBus.getInstance().publish(
            new AlertEnrichedEvent(alert.getId(), result.getStatus(),
                                   result.getHandlerChainSummary())
        );

        log.info("Enrichment complete: alertId={}, status={}, severity={}",
                 alert.getId(), result.getStatus(), result.getClassifiedSeverity());
        return result;
    }

    /**
     * Enrich a batch of alerts and run correlation analysis.
     */
    public CorrelationResult enrichAndCorrelate(List<CanonicalAlert> alerts) {
        log.info("Enriching and correlating batch of {} alerts", alerts.size());

        // Step 1: Enrich all alerts
        Map<UUID, EnrichmentResult> enrichmentResults = new HashMap<>();
        for (CanonicalAlert alert : alerts) {
            EnrichmentResult result = enrichAlert(alert);
            enrichmentResults.put(alert.getId(), result);
        }

        // Step 2: Select and execute correlation strategy
        CorrelationStrategy strategy = strategySelector.selectStrategy(alerts);
        log.info("Selected correlation strategy: {}", strategy.getName());

        CorrelationResult correlationResult = strategy.correlate(alerts, enrichmentResults);
        log.info("Correlation result: {}", correlationResult);

        return correlationResult;
    }

    private EnrichmentResultEntity toEntity(EnrichmentResult result) {
        EnrichmentResultEntity entity = new EnrichmentResultEntity(
            result.getAlertId(),
            result.getStatus() != null ? result.getStatus() : EnrichmentStatus.COMPLETE
        );
        entity.setGeoIpData(result.getGeoIpData() != null ? result.getGeoIpData().toString() : null);
        entity.setThreatIntelData(result.getThreatIntelData() != null ? result.getThreatIntelData().toString() : null);
        entity.setAssetContextData(result.getAssetContextData() != null ? result.getAssetContextData().toString() : null);
        entity.setClassifiedSeverity(result.getClassifiedSeverity());
        entity.setDuplicate(result.isDuplicate());
        entity.setHandlerChainSummary(result.getHandlerChainSummary());
        return entity;
    }
}
