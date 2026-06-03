package com.sdapro.enrichment.domain;

/**
 * POJO holding enriched contextual data aggregated from multiple enrichment handlers.
 *
 * <p>This is a transient object used during pipeline execution; its contents are
 * eventually serialized into the {@link EnrichmentResultEntity} for persistence.</p>
 */
public class ContextData {

    // --- GeoLocation fields ---
    private String country;
    private String city;
    private double latitude;
    private double longitude;

    // --- Threat Intelligence fields ---
    private double threatScore;
    private String threatVerdict;

    // --- Asset Context fields ---
    private String assetCriticality;
    private String assetOwner;
    private String assetBusinessUnit;

    /** Default no-arg constructor. */
    public ContextData() {}

    // --- GeoLocation accessors ---

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    // --- Threat Intelligence accessors ---

    public double getThreatScore() { return threatScore; }
    public void setThreatScore(double threatScore) { this.threatScore = threatScore; }

    public String getThreatVerdict() { return threatVerdict; }
    public void setThreatVerdict(String threatVerdict) { this.threatVerdict = threatVerdict; }

    // --- Asset Context accessors ---

    public String getAssetCriticality() { return assetCriticality; }
    public void setAssetCriticality(String assetCriticality) { this.assetCriticality = assetCriticality; }

    public String getAssetOwner() { return assetOwner; }
    public void setAssetOwner(String assetOwner) { this.assetOwner = assetOwner; }

    public String getAssetBusinessUnit() { return assetBusinessUnit; }
    public void setAssetBusinessUnit(String assetBusinessUnit) { this.assetBusinessUnit = assetBusinessUnit; }

    @Override
    public String toString() {
        return "ContextData{country='" + country + "', city='" + city +
               "', threatScore=" + threatScore + ", threatVerdict='" + threatVerdict +
               "', assetCriticality='" + assetCriticality + "'}";
    }
}
