package com.sdapro.enrichment.services.factory;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * // PATTERN: Abstract Factory (Concrete Factory — Premium Tier)
 * // RATIONALE: Creates premium enrichment providers with detailed data,
 * //            full API access, ISP/ASN detection, multi-source threat intel.
 *
 * Premium tier factory: creates providers with full, detailed enrichment data.
 */
@Component("premiumEnrichmentFactory")
public class PremiumEnrichmentFactory implements EnrichmentProviderFactory {

    @Override
    public GeoLocationService createGeoProvider() {
        // Premium: detailed geo with ISP, ASN, proxy detection
        return ip -> Map.of(
            "country", "Russia", "city", "Moscow",
            "lat", 55.7558, "lon", 37.6173,
            "isp", "LLC Baxet", "asn", "AS51659",
            "isProxy", true, "isVpn", true,
            "tier", "premium"
        );
    }

    @Override
    public ThreatIntelLookupService createThreatIntelProvider() {
        // Premium: detailed multi-source threat scores
        return indicator -> Map.of(
            "verdict", "MALICIOUS", "score", 92.5,
            "sources", "VirusTotal,MISP,AbuseIPDB,OTX",
            "detections", 48, "totalEngines", 70,
            "firstSeen", "2024-01-15", "lastSeen", "2026-06-01",
            "tags", "apt29,cozy-bear,c2-server",
            "tier", "premium"
        );
    }

    @Override
    public AssetLookupService createAssetProvider() {
        // Premium: full CMDB data
        return identifier -> Map.of(
            "criticality", "CRITICAL", "owner", "Platform Team",
            "businessUnit", "Engineering", "type", "Production Server",
            "os", "Ubuntu 22.04 LTS", "lastPatchDate", "2026-05-28",
            "vulnerabilities", 3, "complianceStatus", "SOC2-Compliant",
            "tier", "premium"
        );
    }

    @Override
    public String getTierName() { return "Premium"; }
}
