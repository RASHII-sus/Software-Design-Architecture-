package com.sdapro.alertingestion.services.normalizer;

import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.contracts.CanonicalAlert;

/**
 * // PATTERN: Factory Method (Product Interface)
 * // RATIONALE: Each alert source (Splunk, CrowdStrike, Firewall) produces data in a
 * //            different format. The normalizer interface defines a uniform contract
 * //            for converting any raw format into our canonical alert model.
 *
 * Interface for alert normalizers. Each implementation handles a specific source format
 * and converts raw payload data into the canonical alert representation.
 */
public interface AlertNormalizer {

    /**
     * Normalize a raw alert payload into the canonical alert format.
     *
     * @param rawPayload the raw JSON/text payload from the alert source
     * @return a normalized CanonicalAlert
     */
    CanonicalAlert normalize(String rawPayload);

    /**
     * Check if this normalizer supports the given source type.
     *
     * @param sourceType the alert source type to check
     * @return true if this normalizer can handle the given source type
     */
    boolean supports(AlertSourceType sourceType);
}
