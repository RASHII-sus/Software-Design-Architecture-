package com.sdapro.alertingestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Alert Ingestion Service — Entry Point.
 *
 * Responsible for ingesting security alerts from heterogeneous sources
 * (Splunk, CrowdStrike, Firewalls), normalizing them into a canonical format,
 * and grouping related alerts into composite structures.
 *
 * Design Patterns demonstrated:
 * - Singleton: IngestionConfigManager
 * - Factory Method: AlertNormalizerFactory
 * - Composite: AlertComponent tree (SingleAlert, AlertCampaign, IncidentCluster)
 */
@SpringBootApplication
@EnableScheduling
public class AlertIngestionApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlertIngestionApplication.class, args);
    }
}
