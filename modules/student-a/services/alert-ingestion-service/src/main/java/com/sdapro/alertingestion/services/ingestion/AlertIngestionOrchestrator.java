package com.sdapro.alertingestion.services.ingestion;

import com.sdapro.alertingestion.config.IngestionConfigManager;
import com.sdapro.alertingestion.domain.alert.AlertCampaign;
import com.sdapro.alertingestion.domain.alert.SingleAlert;
import com.sdapro.alertingestion.repositories.AlertCampaignRepository;
import com.sdapro.alertingestion.repositories.AlertRepository;
import com.sdapro.alertingestion.services.normalizer.AlertNormalizerFactory;
import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.events.AlertIngestedEvent;
import com.sdapro.shared.events.SimpleEventBus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates the alert ingestion pipeline:
 * 1. Validates source config via Singleton (IngestionConfigManager)
 * 2. Normalizes raw payload via Factory Method (AlertNormalizerFactory)
 * 3. Creates domain entities (SingleAlert or AlertCampaign — Composite)
 * 4. Persists to database
 * 5. Publishes domain events via Event Bus (Observer)
 */
@Service
public class AlertIngestionOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AlertIngestionOrchestrator.class);

    private final AlertNormalizerFactory normalizerFactory;
    private final AlertRepository alertRepository;
    private final AlertCampaignRepository campaignRepository;

    public AlertIngestionOrchestrator(AlertNormalizerFactory normalizerFactory,
                                      AlertRepository alertRepository,
                                      AlertCampaignRepository campaignRepository) {
        this.normalizerFactory = normalizerFactory;
        this.alertRepository = alertRepository;
        this.campaignRepository = campaignRepository;
    }

    /**
     * Ingest a single alert from a webhook or API call.
     *
     * @param sourceType the type of alert source
     * @param rawPayload the raw JSON payload
     * @return the persisted SingleAlert entity
     */
    public SingleAlert ingestAlert(AlertSourceType sourceType, String rawPayload) {
        // PATTERN: Singleton — access shared configuration
        IngestionConfigManager config = IngestionConfigManager.getInstance();
        if (!config.isIngestionEnabled(sourceType)) {
            throw new IllegalStateException("Ingestion is disabled for source type: " + sourceType);
        }

        log.info("Ingesting alert from source: {}", sourceType);

        // PATTERN: Factory Method — get the correct normalizer for this source
        CanonicalAlert canonical = normalizerFactory.normalize(sourceType, rawPayload);
        log.debug("Normalized alert: {}", canonical);

        // Create leaf entity (Composite leaf)
        SingleAlert alert = new SingleAlert(canonical);
        alert.setRawPayload(rawPayload);

        // Persist
        alertRepository.save(alert);
        log.info("Persisted alert: id={}, title={}", alert.getId(), alert.getTitle());

        // Publish domain event (Observer pattern via event bus)
        SimpleEventBus.getInstance().publish(
            new AlertIngestedEvent(alert.getId(), alert.getTitle(),
                                   alert.getSeverity(), sourceType, false)
        );

        return alert;
    }

    /**
     * Ingest multiple alerts and group them into a Campaign (Composite pattern).
     *
     * @param sourceType    the source type for all alerts
     * @param rawPayloads   list of raw payloads
     * @param campaignName  name for the campaign grouping
     * @param attackPattern the attack pattern (e.g., "APT29-Campaign")
     * @return the persisted AlertCampaign
     */
    public AlertCampaign ingestAndGroupCampaign(AlertSourceType sourceType,
                                                 List<String> rawPayloads,
                                                 String campaignName,
                                                 String attackPattern) {
        IngestionConfigManager config = IngestionConfigManager.getInstance();
        if (!config.isIngestionEnabled(sourceType)) {
            throw new IllegalStateException("Ingestion is disabled for source type: " + sourceType);
        }

        log.info("Ingesting campaign '{}' with {} alerts from {}", campaignName, rawPayloads.size(), sourceType);

        // PATTERN: Composite — create a campaign (composite node) and add alerts (leaves)
        AlertCampaign campaign = new AlertCampaign(campaignName, attackPattern);

        List<SingleAlert> alerts = new ArrayList<>();
        for (String rawPayload : rawPayloads) {
            CanonicalAlert canonical = normalizerFactory.normalize(sourceType, rawPayload);
            SingleAlert alert = new SingleAlert(canonical);
            alert.setRawPayload(rawPayload);
            alerts.add(alert);

            // Add to composite tree
            campaign.add(alert);
        }

        // Persist all alerts first, then the campaign
        alertRepository.saveAll(alerts);
        campaignRepository.save(campaign);
        log.info("Persisted campaign '{}' with {} alerts, max severity: {}",
                 campaignName, alerts.size(), campaign.getMaxSeverity());

        // Publish event
        SimpleEventBus.getInstance().publish(
            new AlertIngestedEvent(campaign.getId(), campaign.getTitle(),
                                   campaign.getSeverity(), sourceType, true)
        );

        return campaign;
    }
}
