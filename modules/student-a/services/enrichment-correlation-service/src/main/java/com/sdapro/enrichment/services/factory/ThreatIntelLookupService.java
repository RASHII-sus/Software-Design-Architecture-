package com.sdapro.enrichment.services.factory;

import java.util.Map;

/** Service interface for threat intelligence lookups. */
public interface ThreatIntelLookupService {
    Map<String, Object> checkReputation(String indicator);
}
