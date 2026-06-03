package com.sdapro.alertingestion.config;

import com.sdapro.shared.commons.AlertSourceType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * // PATTERN: Singleton
 * // RATIONALE: Provides a single, globally-shared source of truth for alert ingestion
 * //            configuration. All services that need ingestion settings (polling intervals,
 * //            feature flags, batch sizes) access the same instance, ensuring consistency
 * //            and preventing conflicting configurations.
 *
 * Thread-safe Singleton managing ingestion configuration for all alert sources.
 * Uses double-checked locking with volatile for safe lazy initialization.
 */
public class IngestionConfigManager {

    // PATTERN: Singleton — volatile ensures visibility across threads
    private static volatile IngestionConfigManager instance;

    private final Map<AlertSourceType, AlertSourceConfig> configs;

    /**
     * Private constructor — prevents external instantiation.
     * Pre-loads default configurations for all supported source types.
     */
    private IngestionConfigManager() {
        this.configs = new ConcurrentHashMap<>();
        loadDefaults();
    }

    /**
     * Returns the singleton instance using double-checked locking.
     * Thread-safe and lazy-initialized.
     *
     * @return the single IngestionConfigManager instance
     */
    public static IngestionConfigManager getInstance() {
        if (instance == null) {
            synchronized (IngestionConfigManager.class) {
                if (instance == null) {
                    instance = new IngestionConfigManager();
                }
            }
        }
        return instance;
    }

    /**
     * Get the configuration for a specific alert source type.
     */
    public AlertSourceConfig getSourceConfig(AlertSourceType type) {
        return configs.getOrDefault(type, AlertSourceConfig.defaultConfig());
    }

    /**
     * Check if ingestion is enabled for a specific source type.
     */
    public boolean isIngestionEnabled(AlertSourceType type) {
        AlertSourceConfig config = configs.get(type);
        return config != null && config.isEnabled();
    }

    /**
     * Get the polling interval for a specific source type.
     */
    public int getPollingInterval(AlertSourceType type) {
        AlertSourceConfig config = configs.get(type);
        return config != null ? config.getPollingIntervalSeconds() : 60;
    }

    /**
     * Update configuration for a source type at runtime.
     */
    public void updateConfig(AlertSourceType type, AlertSourceConfig config) {
        configs.put(type, config);
    }

    /**
     * Get all configurations (read-only snapshot).
     */
    public Map<AlertSourceType, AlertSourceConfig> getAllConfigs() {
        return new ConcurrentHashMap<>(configs);
    }

    /**
     * Pre-load default configurations for all supported source types.
     */
    private void loadDefaults() {
        configs.put(AlertSourceType.SPLUNK, new AlertSourceConfig(true, 30, 100, 3));
        configs.put(AlertSourceType.CROWDSTRIKE, new AlertSourceConfig(true, 45, 50, 3));
        configs.put(AlertSourceType.FIREWALL, new AlertSourceConfig(true, 60, 200, 2));
        configs.put(AlertSourceType.CLOUD_SIEM, new AlertSourceConfig(true, 30, 100, 3));
        configs.put(AlertSourceType.CUSTOM, new AlertSourceConfig(false, 120, 50, 1));
    }

    /**
     * Reset singleton instance (for testing only).
     */
    public static void resetInstance() {
        synchronized (IngestionConfigManager.class) {
            instance = null;
        }
    }

    /**
     * Configuration for an individual alert source.
     */
    public static class AlertSourceConfig {

        private boolean enabled;
        private int pollingIntervalSeconds;
        private int maxBatchSize;
        private int retryAttempts;

        public AlertSourceConfig() {}

        public AlertSourceConfig(boolean enabled, int pollingIntervalSeconds, int maxBatchSize, int retryAttempts) {
            this.enabled = enabled;
            this.pollingIntervalSeconds = pollingIntervalSeconds;
            this.maxBatchSize = maxBatchSize;
            this.retryAttempts = retryAttempts;
        }

        public static AlertSourceConfig defaultConfig() {
            return new AlertSourceConfig(false, 60, 50, 1);
        }

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }

        public int getPollingIntervalSeconds() { return pollingIntervalSeconds; }
        public void setPollingIntervalSeconds(int pollingIntervalSeconds) { this.pollingIntervalSeconds = pollingIntervalSeconds; }

        public int getMaxBatchSize() { return maxBatchSize; }
        public void setMaxBatchSize(int maxBatchSize) { this.maxBatchSize = maxBatchSize; }

        public int getRetryAttempts() { return retryAttempts; }
        public void setRetryAttempts(int retryAttempts) { this.retryAttempts = retryAttempts; }

        @Override
        public String toString() {
            return "AlertSourceConfig{enabled=" + enabled + ", poll=" + pollingIntervalSeconds +
                   "s, batch=" + maxBatchSize + ", retries=" + retryAttempts + "}";
        }
    }
}
