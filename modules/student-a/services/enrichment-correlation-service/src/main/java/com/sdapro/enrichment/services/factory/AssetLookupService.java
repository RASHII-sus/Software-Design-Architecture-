package com.sdapro.enrichment.services.factory;

import java.util.Map;

/** Service interface for asset inventory lookups. */
public interface AssetLookupService {
    Map<String, Object> lookupAsset(String identifier);
}
