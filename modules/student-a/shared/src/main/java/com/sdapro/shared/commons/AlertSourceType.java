package com.sdapro.shared.commons;

/**
 * Enumeration of supported alert source types.
 * Each source type maps to a specific AlertNormalizer via the Factory Method pattern.
 */
public enum AlertSourceType {
    SPLUNK,
    CROWDSTRIKE,
    FIREWALL,
    CLOUD_SIEM,
    CUSTOM
}
