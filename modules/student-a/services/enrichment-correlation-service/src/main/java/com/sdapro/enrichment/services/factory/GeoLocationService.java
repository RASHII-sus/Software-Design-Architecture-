package com.sdapro.enrichment.services.factory;

import java.util.Map;

/** Service interface for geo-location lookups. */
public interface GeoLocationService {
    Map<String, Object> lookup(String ip);
}
