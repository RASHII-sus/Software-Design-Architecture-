package com.sdapro.alertingestion.services.normalizer;

import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.contracts.CanonicalAlert;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * // PATTERN: Factory Method (Creator)
 * // RATIONALE: Different alert sources produce different data formats. The factory
 * //            encapsulates the logic of selecting the correct normalizer based on
 * //            source type, so client code doesn't need to know which concrete
 * //            normalizer to instantiate. Adding a new source only requires
 * //            creating a new normalizer — no changes to existing code (Open/Closed Principle).
 *
 * Factory that creates the appropriate AlertNormalizer for a given source type.
 * Uses Spring's dependency injection to auto-discover all normalizer implementations.
 */
@Component
public class AlertNormalizerFactory {

    private final List<AlertNormalizer> normalizers;

    /**
     * Spring auto-injects all beans implementing AlertNormalizer.
     */
    public AlertNormalizerFactory(List<AlertNormalizer> normalizers) {
        this.normalizers = normalizers;
    }

    /**
     * // PATTERN: Factory Method — creates the correct product based on type
     *
     * Find and return the normalizer that supports the given source type.
     *
     * @param sourceType the type of alert source
     * @return the appropriate AlertNormalizer implementation
     * @throws IllegalArgumentException if no normalizer supports the given type
     */
    public AlertNormalizer createNormalizer(AlertSourceType sourceType) {
        return normalizers.stream()
                .filter(n -> n.supports(sourceType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No normalizer registered for source type: " + sourceType +
                        ". Registered normalizers: " + normalizers.size()));
    }

    /**
     * Convenience method: normalize a raw payload from a given source type.
     * Combines factory creation and normalization in one step.
     */
    public CanonicalAlert normalize(AlertSourceType sourceType, String rawPayload) {
        AlertNormalizer normalizer = createNormalizer(sourceType);
        return normalizer.normalize(rawPayload);
    }

    /**
     * Check if a normalizer is available for the given source type.
     */
    public boolean hasNormalizer(AlertSourceType sourceType) {
        return normalizers.stream().anyMatch(n -> n.supports(sourceType));
    }
}
