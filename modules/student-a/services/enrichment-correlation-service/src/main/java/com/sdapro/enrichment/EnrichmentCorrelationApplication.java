package com.sdapro.enrichment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Enrichment & Correlation Service — Entry Point.
 *
 * Design Patterns demonstrated:
 * - Chain of Responsibility: EnrichmentHandler pipeline (5 handlers)
 * - Abstract Factory: EnrichmentProviderFactory (Premium/Standard tiers)
 * - Strategy: CorrelationStrategy (3 algorithms)
 * - Composite: Traversal of alert campaign/cluster trees
 */
@SpringBootApplication
public class EnrichmentCorrelationApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnrichmentCorrelationApplication.class, args);
    }
}
