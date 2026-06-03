package com.sdapro.enrichment.services.pipeline;

import com.sdapro.shared.contracts.CanonicalAlert;
import com.sdapro.shared.contracts.EnrichmentResult;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * // PATTERN: Chain of Responsibility (Concrete Handler #2)
 * // RATIONALE: Enriches alerts with geographic location data based on source IP.
 * //            Adds country, city, latitude, longitude for SOC analyst context.
 *
 * GeoIP enrichment handler. Uses a simulated lookup for demo purposes.
 */
@Component
public class GeoIPHandler extends EnrichmentHandler {

    // Simulated GeoIP database for demo
    private static final Map<String, Map<String, Object>> GEO_DB = new HashMap<>();
    static {
        GEO_DB.put("192.168", Map.of("country", "Internal", "city", "HQ", "lat", 37.7749, "lon", -122.4194));
        GEO_DB.put("10.", Map.of("country", "Internal", "city", "Branch Office", "lat", 40.7128, "lon", -74.0060));
        GEO_DB.put("203.0.113", Map.of("country", "Russia", "city", "Moscow", "lat", 55.7558, "lon", 37.6173));
        GEO_DB.put("198.51.100", Map.of("country", "China", "city", "Beijing", "lat", 39.9042, "lon", 116.4074));
        GEO_DB.put("45.33", Map.of("country", "Netherlands", "city", "Amsterdam", "lat", 52.3676, "lon", 4.9041));
    }

    @Override
    protected EnrichmentResult doEnrich(CanonicalAlert alert, EnrichmentResult result) {
        String sourceIp = alert.getSourceIp();
        Map<String, Object> geoData = lookupGeoIP(sourceIp);
        result.setGeoIpData(geoData);
        return result;
    }

    @Override
    public String getHandlerName() {
        return "GeoIPHandler";
    }

    private Map<String, Object> lookupGeoIP(String ip) {
        if (ip == null || ip.isEmpty()) {
            return Map.of("country", "Unknown", "city", "Unknown", "lat", 0.0, "lon", 0.0);
        }
        // Check prefixes
        for (Map.Entry<String, Map<String, Object>> entry : GEO_DB.entrySet()) {
            if (ip.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        // Default external IP geo
        return Map.of("country", "United States", "city", "San Francisco", "lat", 37.7749, "lon", -122.4194);
    }
}
