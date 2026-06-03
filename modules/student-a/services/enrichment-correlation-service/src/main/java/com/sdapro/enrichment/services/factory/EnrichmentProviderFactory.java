package com.sdapro.enrichment.services.factory;

import java.util.Map;

/**
 * // PATTERN: Abstract Factory (Abstract Factory Interface)
 * // RATIONALE: Creates families of related enrichment providers for different tiers.
 * //            Premium tier uses detailed API providers; Standard tier uses basic/cached
 * //            providers. Ensures all providers in a family are compatible.
 *
 * Abstract factory for creating families of enrichment service providers.
 * Each factory creates a complete set of providers (Geo, ThreatIntel, Asset).
 */
public interface EnrichmentProviderFactory {

    /** Create a geo-location lookup provider. */
    GeoLocationService createGeoProvider();

    /** Create a threat intelligence lookup provider. */
    ThreatIntelLookupService createThreatIntelProvider();

    /** Create an asset inventory lookup provider. */
    AssetLookupService createAssetProvider();

    /** Get the tier name of this factory. */
    String getTierName();
}
