package com.sdapro.enrichment;

import com.sdapro.enrichment.services.factory.*;
import com.sdapro.enrichment.services.pipeline.*;
import com.sdapro.enrichment.services.strategy.*;
import com.sdapro.shared.commons.EnrichmentStatus;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.CorrelationResult;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.junit.jupiter.api.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Chain of Responsibility, Abstract Factory, and Strategy patterns.
 */
class EnrichmentPatternTests {

    // ========================================================================
    // CHAIN OF RESPONSIBILITY TESTS
    // ========================================================================

    @Nested
    @DisplayName("PATTERN: Chain of Responsibility — Enrichment Pipeline")
    class ChainOfResponsibilityTests {

        @Test
        @DisplayName("Full pipeline processes alert through all 5 handlers")
        void testFullPipeline() {
            EnrichmentPipelineAssembler assembler = new EnrichmentPipelineAssembler(
                new DeduplicationHandler(), new GeoIPHandler(),
                new ThreatIntelHandler(), new AssetContextHandler(),
                new ClassificationHandler()
            );

            CanonicalAlert alert = createTestAlert("Test Alert", "203.0.113.50", "web-server-01");
            EnrichmentResult result = assembler.executePipeline(alert);

            assertNotNull(result);
            assertEquals(EnrichmentStatus.COMPLETE, result.getStatus());
            assertNotNull(result.getGeoIpData());
            assertNotNull(result.getThreatIntelData());
            assertNotNull(result.getAssetContextData());
            assertNotNull(result.getClassifiedSeverity());
            assertNotNull(result.getHandlerChainSummary());
        }

        @Test
        @DisplayName("Deduplication handler stops chain for duplicate alerts")
        void testDeduplicationStopsChain() {
            DeduplicationHandler dedupHandler = new DeduplicationHandler();
            EnrichmentPipelineAssembler assembler = new EnrichmentPipelineAssembler(
                dedupHandler, new GeoIPHandler(),
                new ThreatIntelHandler(), new AssetContextHandler(),
                new ClassificationHandler()
            );

            CanonicalAlert alert = createTestAlert("Same Alert", "1.2.3.4", "host");

            // First processing — should succeed
            EnrichmentResult result1 = assembler.executePipeline(alert);
            assertEquals(EnrichmentStatus.COMPLETE, result1.getStatus());
            assertFalse(result1.isDuplicate());

            // Second processing — should be detected as duplicate
            EnrichmentResult result2 = assembler.executePipeline(alert);
            assertEquals(EnrichmentStatus.DUPLICATE_SKIPPED, result2.getStatus());
            assertTrue(result2.isDuplicate());

            dedupHandler.clearCache();
        }

        @Test
        @DisplayName("GeoIP handler enriches with location data")
        void testGeoIPEnrichment() {
            GeoIPHandler handler = new GeoIPHandler();
            CanonicalAlert alert = createTestAlert("Test", "203.0.113.50", "host");
            EnrichmentResult result = new EnrichmentResult(alert.getId(), null);

            // Use public handle() method — doEnrich() is protected
            EnrichmentResult enriched = handler.handle(alert, result);

            assertNotNull(enriched.getGeoIpData());
            assertEquals("Russia", enriched.getGeoIpData().get("country"));
        }

        @Test
        @DisplayName("Malicious IP gets CRITICAL classification with high-criticality asset")
        void testMaliciousHighCriticalClassification() {
            EnrichmentPipelineAssembler assembler = new EnrichmentPipelineAssembler(
                new DeduplicationHandler(), new GeoIPHandler(),
                new ThreatIntelHandler(), new AssetContextHandler(),
                new ClassificationHandler()
            );

            CanonicalAlert alert = createTestAlert("Attack", "203.0.113.50", "db-master-01");
            EnrichmentResult result = assembler.executePipeline(alert);

            assertEquals("CRITICAL", result.getClassifiedSeverity());
        }
    }

    // ========================================================================
    // ABSTRACT FACTORY TESTS
    // ========================================================================

    @Nested
    @DisplayName("PATTERN: Abstract Factory — EnrichmentProviderFactory")
    class AbstractFactoryTests {

        @Test
        @DisplayName("PremiumFactory creates premium-tier providers")
        void testPremiumFactory() {
            EnrichmentProviderFactory factory = new PremiumEnrichmentFactory();
            assertEquals("Premium", factory.getTierName());

            GeoLocationService geo = factory.createGeoProvider();
            Map<String, Object> geoResult = geo.lookup("1.2.3.4");
            assertEquals("premium", geoResult.get("tier"));
            assertTrue(geoResult.containsKey("isp"));

            ThreatIntelLookupService intel = factory.createThreatIntelProvider();
            Map<String, Object> intelResult = intel.checkReputation("1.2.3.4");
            assertEquals("premium", intelResult.get("tier"));
            assertTrue(intelResult.containsKey("detections"));
        }

        @Test
        @DisplayName("StandardFactory creates standard-tier providers")
        void testStandardFactory() {
            EnrichmentProviderFactory factory = new StandardEnrichmentFactory();
            assertEquals("Standard", factory.getTierName());

            GeoLocationService geo = factory.createGeoProvider();
            Map<String, Object> geoResult = geo.lookup("1.2.3.4");
            assertEquals("standard", geoResult.get("tier"));
            assertFalse(geoResult.containsKey("isp"));
        }

        @Test
        @DisplayName("Provider families are internally consistent")
        void testFamilyConsistency() {
            EnrichmentProviderFactory premium = new PremiumEnrichmentFactory();
            GeoLocationService premGeo = premium.createGeoProvider();
            ThreatIntelLookupService premIntel = premium.createThreatIntelProvider();
            AssetLookupService premAsset = premium.createAssetProvider();

            // All providers from same factory should return same tier
            assertEquals("premium", premGeo.lookup("x").get("tier"));
            assertEquals("premium", premIntel.checkReputation("x").get("tier"));
            assertEquals("premium", premAsset.lookupAsset("x").get("tier"));
        }
    }

    // ========================================================================
    // STRATEGY TESTS
    // ========================================================================

    @Nested
    @DisplayName("PATTERN: Strategy — Correlation Strategies")
    class StrategyTests {

        @Test
        @DisplayName("PatternMatching detects attack kill-chain")
        void testPatternMatchingDetectsKillChain() {
            PatternMatchingCorrelation strategy = new PatternMatchingCorrelation();

            List<CanonicalAlert> alerts = List.of(
                createTestAlert("Recon", "1.1.1.1", "h", "reconnaissance"),
                createTestAlert("Lateral", "1.1.1.1", "h", "lateral-movement"),
                createTestAlert("Exfil", "1.1.1.1", "h", "exfiltration")
            );

            CorrelationResult result = strategy.correlate(alerts, Map.of());
            assertEquals(CorrelationResult.Action.CREATE_INCIDENT, result.getAction());
            assertTrue(result.getConfidenceScore() >= 0.7);
        }

        @Test
        @DisplayName("ThresholdCorrelation triggers on 3+ CRITICAL alerts")
        void testThresholdWithCriticalAlerts() {
            ThresholdCorrelation strategy = new ThresholdCorrelation();

            List<CanonicalAlert> alerts = new ArrayList<>();
            for (int i = 0; i < 3; i++) {
                CanonicalAlert a = createTestAlert("Alert " + i, "1.1.1." + i, "host");
                a.setSeverity(Severity.CRITICAL);
                alerts.add(a);
            }

            CorrelationResult result = strategy.correlate(alerts, Map.of());
            assertEquals(CorrelationResult.Action.CREATE_INCIDENT, result.getAction());
        }

        @Test
        @DisplayName("TimeWindowCorrelation groups by source IP")
        void testTimeWindowGroups() {
            TimeWindowCorrelation strategy = new TimeWindowCorrelation();

            List<CanonicalAlert> alerts = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                alerts.add(createTestAlert("Alert " + i, "10.0.0.1", "host"));
            }

            CorrelationResult result = strategy.correlate(alerts, Map.of());
            assertEquals(CorrelationResult.Action.CREATE_INCIDENT, result.getAction());
        }

        @Test
        @DisplayName("StrategySelector picks PatternMatching for diverse categories")
        void testSelectorPicksPatternMatching() {
            CorrelationStrategySelector selector = new CorrelationStrategySelector(
                new PatternMatchingCorrelation(),
                new ThresholdCorrelation(),
                new TimeWindowCorrelation()
            );

            List<CanonicalAlert> alerts = List.of(
                createTestAlert("A", "1.1.1.1", "h", "reconnaissance"),
                createTestAlert("B", "1.1.1.1", "h", "lateral-movement")
            );

            CorrelationStrategy selected = selector.selectStrategy(alerts);
            assertEquals("PatternMatchingCorrelation", selected.getName());
        }
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private CanonicalAlert createTestAlert(String title, String sourceIp, String hostname) {
        return createTestAlert(title, sourceIp, hostname, "unknown");
    }

    private CanonicalAlert createTestAlert(String title, String sourceIp, String hostname, String category) {
        CanonicalAlert alert = new CanonicalAlert();
        alert.setTitle(title);
        alert.setSourceIp(sourceIp);
        alert.setHostName(hostname);
        alert.setAttackCategory(category);
        alert.setSeverity(Severity.MEDIUM);
        return alert;
    }
}
