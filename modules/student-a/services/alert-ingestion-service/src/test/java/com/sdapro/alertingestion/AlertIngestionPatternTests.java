package com.sdapro.alertingestion;

import com.sdapro.alertingestion.config.IngestionConfigManager;
import com.sdapro.alertingestion.domain.alert.*;
import com.sdapro.alertingestion.services.normalizer.*;
import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.contracts.CanonicalAlert;
import org.junit.jupiter.api.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests verifying all 3 design patterns in the Alert Ingestion Service:
 * - Singleton: IngestionConfigManager
 * - Factory Method: AlertNormalizerFactory
 * - Composite: AlertComponent tree
 */
class AlertIngestionPatternTests {

    // ========================================================================
    // SINGLETON PATTERN TESTS
    // ========================================================================

    @Nested
    @DisplayName("PATTERN: Singleton — IngestionConfigManager")
    class SingletonTests {

        @BeforeEach
        void resetSingleton() {
            IngestionConfigManager.resetInstance();
        }

        @Test
        @DisplayName("getInstance() always returns the same instance")
        void testSingleInstance() {
            IngestionConfigManager instance1 = IngestionConfigManager.getInstance();
            IngestionConfigManager instance2 = IngestionConfigManager.getInstance();
            assertSame(instance1, instance2, "Singleton must return the same instance");
        }

        @Test
        @DisplayName("Thread-safety: concurrent access returns same instance")
        void testThreadSafety() throws Exception {
            int threadCount = 10;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            List<Future<IngestionConfigManager>> futures = new ArrayList<>();

            for (int i = 0; i < threadCount; i++) {
                futures.add(executor.submit(IngestionConfigManager::getInstance));
            }

            IngestionConfigManager first = futures.get(0).get();
            for (Future<IngestionConfigManager> future : futures) {
                assertSame(first, future.get(), "All threads must get the same instance");
            }
            executor.shutdown();
        }

        @Test
        @DisplayName("Default configs are pre-loaded for all source types")
        void testDefaultConfigs() {
            IngestionConfigManager config = IngestionConfigManager.getInstance();
            assertTrue(config.isIngestionEnabled(AlertSourceType.SPLUNK));
            assertTrue(config.isIngestionEnabled(AlertSourceType.CROWDSTRIKE));
            assertTrue(config.isIngestionEnabled(AlertSourceType.FIREWALL));
            assertFalse(config.isIngestionEnabled(AlertSourceType.CUSTOM));
        }

        @Test
        @DisplayName("Configuration can be updated at runtime")
        void testUpdateConfig() {
            IngestionConfigManager config = IngestionConfigManager.getInstance();
            assertFalse(config.isIngestionEnabled(AlertSourceType.CUSTOM));

            config.updateConfig(AlertSourceType.CUSTOM,
                new IngestionConfigManager.AlertSourceConfig(true, 30, 50, 2));

            assertTrue(config.isIngestionEnabled(AlertSourceType.CUSTOM));
        }
    }

    // ========================================================================
    // FACTORY METHOD PATTERN TESTS
    // ========================================================================

    @Nested
    @DisplayName("PATTERN: Factory Method — AlertNormalizerFactory")
    class FactoryMethodTests {

        private AlertNormalizerFactory factory;

        @BeforeEach
        void setup() {
            List<AlertNormalizer> normalizers = List.of(
                new SplunkNormalizer(),
                new CrowdStrikeNormalizer(),
                new FirewallNormalizer()
            );
            factory = new AlertNormalizerFactory(normalizers);
        }

        @Test
        @DisplayName("Factory creates SplunkNormalizer for SPLUNK source type")
        void testCreateSplunkNormalizer() {
            AlertNormalizer normalizer = factory.createNormalizer(AlertSourceType.SPLUNK);
            assertNotNull(normalizer);
            assertTrue(normalizer instanceof SplunkNormalizer);
        }

        @Test
        @DisplayName("Factory creates CrowdStrikeNormalizer for CROWDSTRIKE source type")
        void testCreateCrowdStrikeNormalizer() {
            AlertNormalizer normalizer = factory.createNormalizer(AlertSourceType.CROWDSTRIKE);
            assertNotNull(normalizer);
            assertTrue(normalizer instanceof CrowdStrikeNormalizer);
        }

        @Test
        @DisplayName("Factory creates FirewallNormalizer for FIREWALL source type")
        void testCreateFirewallNormalizer() {
            AlertNormalizer normalizer = factory.createNormalizer(AlertSourceType.FIREWALL);
            assertNotNull(normalizer);
            assertTrue(normalizer instanceof FirewallNormalizer);
        }

        @Test
        @DisplayName("Factory throws for unsupported source type")
        void testThrowsForUnsupported() {
            assertThrows(IllegalArgumentException.class, () ->
                factory.createNormalizer(AlertSourceType.CUSTOM));
        }

        @Test
        @DisplayName("SplunkNormalizer produces valid CanonicalAlert")
        void testSplunkNormalization() {
            String payload = """
                {"result": {"search_name": "Brute Force Attack",
                 "src_ip": "192.168.1.100", "dest_ip": "10.0.0.5",
                 "severity": "8", "user": "admin", "host": "web-server-01",
                 "category": "authentication-attack"}}
                """;
            CanonicalAlert alert = factory.normalize(AlertSourceType.SPLUNK, payload);
            assertEquals("Brute Force Attack", alert.getTitle());
            assertEquals("192.168.1.100", alert.getSourceIp());
            assertEquals(Severity.CRITICAL, alert.getSeverity());
            assertEquals(AlertSourceType.SPLUNK, alert.getSourceType());
        }

        @Test
        @DisplayName("CrowdStrikeNormalizer produces valid CanonicalAlert")
        void testCrowdStrikeNormalization() {
            String payload = """
                {"detect_name": "Ransomware Detected",
                 "detect_id": "ldt:abc123",
                 "device_external_ip": "203.0.113.50",
                 "hostname": "workstation-42",
                 "severity": 5, "tactic": "execution"}
                """;
            CanonicalAlert alert = factory.normalize(AlertSourceType.CROWDSTRIKE, payload);
            assertEquals("Ransomware Detected", alert.getTitle());
            assertEquals("203.0.113.50", alert.getSourceIp());
            assertEquals(Severity.CRITICAL, alert.getSeverity());
        }
    }

    // ========================================================================
    // COMPOSITE PATTERN TESTS
    // ========================================================================

    @Nested
    @DisplayName("PATTERN: Composite — AlertComponent tree")
    class CompositeTests {

        @Test
        @DisplayName("SingleAlert is a leaf node")
        void testSingleAlertIsLeaf() {
            CanonicalAlert canonical = new CanonicalAlert();
            canonical.setTitle("Test Alert");
            canonical.setSeverity(Severity.HIGH);
            SingleAlert alert = new SingleAlert(canonical);

            assertTrue(alert.isLeaf());
            assertTrue(alert.getChildren().isEmpty());
            assertThrows(UnsupportedOperationException.class, () ->
                alert.add(new SingleAlert(new CanonicalAlert())));
        }

        @Test
        @DisplayName("AlertCampaign can add and remove children")
        void testCampaignAddRemove() {
            AlertCampaign campaign = new AlertCampaign("APT29", "lateral-movement");

            CanonicalAlert c1 = new CanonicalAlert();
            c1.setTitle("Alert 1");
            c1.setSeverity(Severity.MEDIUM);
            SingleAlert a1 = new SingleAlert(c1);

            CanonicalAlert c2 = new CanonicalAlert();
            c2.setTitle("Alert 2");
            c2.setSeverity(Severity.HIGH);
            SingleAlert a2 = new SingleAlert(c2);

            campaign.add(a1);
            campaign.add(a2);
            assertFalse(campaign.isLeaf());
            assertEquals(2, campaign.getChildren().size());
            assertEquals(2, campaign.getChildAlertIds().size());

            campaign.remove(a1);
            assertEquals(1, campaign.getChildren().size());
        }

        @Test
        @DisplayName("AlertCampaign.getSeverity() returns max severity of children")
        void testCampaignMaxSeverity() {
            AlertCampaign campaign = new AlertCampaign("TestCampaign", "test");

            CanonicalAlert c1 = new CanonicalAlert();
            c1.setSeverity(Severity.LOW);
            campaign.add(new SingleAlert(c1));

            CanonicalAlert c2 = new CanonicalAlert();
            c2.setSeverity(Severity.CRITICAL);
            campaign.add(new SingleAlert(c2));

            CanonicalAlert c3 = new CanonicalAlert();
            c3.setSeverity(Severity.MEDIUM);
            campaign.add(new SingleAlert(c3));

            assertEquals(Severity.CRITICAL, campaign.getSeverity());
        }

        @Test
        @DisplayName("Nested composites — campaign containing clusters")
        void testNestedComposites() {
            // Campaign → contains IncidentCluster → contains SingleAlerts
            AlertCampaign campaign = new AlertCampaign("APT Campaign", "multi-stage");

            IncidentCluster cluster = new IncidentCluster("Related Alerts", "same-source-ip");

            CanonicalAlert c1 = new CanonicalAlert();
            c1.setSeverity(Severity.HIGH);
            cluster.add(new SingleAlert(c1));

            CanonicalAlert c2 = new CanonicalAlert();
            c2.setSeverity(Severity.CRITICAL);
            cluster.add(new SingleAlert(c2));

            campaign.add(cluster);

            // Campaign severity should reflect the nested critical alert
            assertEquals(Severity.CRITICAL, campaign.getSeverity());
            assertEquals(1, campaign.getChildren().size());
            assertEquals(2, cluster.getChildren().size());
        }

        @Test
        @DisplayName("Uniform traversal via AlertComponent interface")
        void testUniformTraversal() {
            // Both single alerts and campaigns can be processed uniformly
            List<AlertComponent> components = new ArrayList<>();

            CanonicalAlert c1 = new CanonicalAlert();
            c1.setTitle("Solo Alert");
            c1.setSeverity(Severity.MEDIUM);
            components.add(new SingleAlert(c1));

            AlertCampaign campaign = new AlertCampaign("Campaign", "test");
            CanonicalAlert c2 = new CanonicalAlert();
            c2.setTitle("Grouped Alert");
            c2.setSeverity(Severity.HIGH);
            campaign.add(new SingleAlert(c2));
            components.add(campaign);

            // All components respond to the same interface
            for (AlertComponent component : components) {
                assertNotNull(component.getId());
                assertNotNull(component.getSeverity());
                assertNotNull(component.getTitle());
            }
        }
    }
}
