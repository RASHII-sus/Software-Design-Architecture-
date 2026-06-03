# ADR-001: SOA vs. Microservices vs. Modular Monolith

## Status
**Accepted**

## Date
2026-06-02

## Context
SDA-Pro requires a distributed architecture to handle security alert ingestion, enrichment, correlation, incident lifecycle management, and response orchestration. The team of 3 students needs clear module boundaries with independent development and deployment capabilities.

Three architectural approaches were considered:

1. **Microservices** — Fully independent services with separate databases, message queues, and deployment pipelines.
2. **SOA (Service-Oriented Architecture)** — Autonomous services with well-defined contracts, sharing common infrastructure.
3. **Modular Monolith** — Single deployable with internal module boundaries.

## Decision
We chose **SOA (Service-Oriented Architecture)** for the following reasons:

### Why SOA over Microservices
- **Reduced operational complexity**: True microservices require service discovery, circuit breakers, distributed tracing, and independent CI/CD pipelines — excessive overhead for a 2-week semester project with 3 students.
- **Shared infrastructure**: SOA allows shared message bus, logging infrastructure, and authentication without the per-service overhead of microservices.
- **Team size alignment**: With 3 students, each owning 2-3 services, SOA's coarser granularity maps better to team boundaries than fine-grained microservices.

### Why SOA over Modular Monolith
- **Clear deployment boundaries**: SOA services can be independently started and stopped, enabling parallel development without merge conflicts.
- **Technology flexibility**: Different services can evolve their tech stacks independently (though we standardize on Spring Boot for consistency).
- **Pattern demonstration**: SOA naturally requires Adapter, Facade, Proxy, and Observer patterns for inter-service communication, satisfying the project's 12-pattern requirement.
- **Real-world relevance**: SOC platforms in production (Splunk SOAR, IBM QRadar) use SOA architectures.

## Consequences
### Positive
- Clear ownership: Each student owns specific services with defined API contracts.
- Services communicate via REST (synchronous) and event bus (asynchronous), demonstrating both communication patterns.
- Independent scaling potential for alert-heavy vs. response-heavy workloads.

### Negative
- Inter-service communication adds latency compared to in-process calls.
- Need to maintain API contracts and handle service unavailability.
- Docker Compose required for local development.

### Risks
- Integration failures at service boundaries (mitigated by defining canonical schemas in `shared/` module in Week 1).
- Uneven workload distribution (mitigated by weekly stand-ups and peer evaluation).
