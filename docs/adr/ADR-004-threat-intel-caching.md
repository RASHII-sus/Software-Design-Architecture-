# ADR-004: Threat Intel Caching Strategy

## Status

Accepted

## Context

Threat intelligence providers such as VirusTotal and MISP are rate-limited and can be slow or unavailable.

## Decision

Use a Proxy pattern stack in Student B:

- `AccessControlProxy`
- `RateLimitProxy`
- `CachingProxy`

The cache implementation is backed by Redis through `ThreatIntelCacheService` when infrastructure is available.

## Consequences

External API calls are protected from excessive use, unauthorized access, and repeated lookups. Tests can mock adapters while still validating proxy behavior.
