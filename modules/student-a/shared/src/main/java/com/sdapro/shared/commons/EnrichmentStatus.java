package com.sdapro.shared.commons;

/**
 * Enrichment status indicating the outcome of an enrichment handler.
 */
public enum EnrichmentStatus {
    /** Enrichment completed successfully */
    COMPLETE,
    /** Alert was identified as a duplicate and should be skipped */
    DUPLICATE_SKIPPED,
    /** Enrichment partially completed (some data unavailable) */
    PARTIAL,
    /** Enrichment failed but pipeline should continue */
    FAILED_CONTINUE,
    /** Enrichment failed and pipeline should stop */
    FAILED_STOP
}
