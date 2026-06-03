package com.sdapro.enrichment.services.factory;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * // PATTERN: Abstract Factory (Concrete Factory — Standard Tier)
 * // RATIONALE: Creates basic enrichment providers with limited data,
 * //            suitable for lower-tier or high-volume processing.
 *
 * Standard tier factory: creates providers with basic enrichment data.
 */
@Component("standardEnrichmentFactory")
public class StandardEnrichmentFactory implements EnrichmentProviderFactory {

    @Override
    public GeoLocationService createGeoProvider() {
        // Standard: country-level only
        return ip -> Map.of(
            "country", "Unknown", "city", "N/A",
            "lat", 0.0, "lon", 0.0,
            "tier", "standard"
        );
    }

    @Override
    public ThreatIntelLookupService createThreatIntelProvider() {
        // Standard: basic verdict only
        return indicator -> Map.of(
            "verdict", "UNKNOWN", "score", 50.0,
            "sources", "BasicDB",
            "tier", "standard"
        );
    }

    @Override
    public AssetLookupService createAssetProvider() {
        // Standard: criticality only
        return identifier -> Map.of(
            "criticality", "MEDIUM", "owner", "Unknown",
            "tier", "standard"
        );
    }

    @Override
    public String getTierName() { return "Standard"; }
}
