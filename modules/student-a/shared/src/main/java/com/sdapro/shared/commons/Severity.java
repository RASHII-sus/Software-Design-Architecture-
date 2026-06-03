package com.sdapro.shared.commons;

/**
 * Severity levels for security alerts and incidents.
 * Used across all services for consistent classification.
 */
public enum Severity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    /**
     * Check if this severity is greater than or equal to the given threshold.
     */
    public boolean isAtLeast(Severity threshold) {
        return this.ordinal() >= threshold.ordinal();
    }
}
