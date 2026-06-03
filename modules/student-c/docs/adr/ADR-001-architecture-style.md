# ADR-001: Architecture Style Selection

**Date:** 2024-01-15  
**Status:** Accepted  
**Author:** Student C – SOC Platform Engineer  
**Project:** SDA-Pro – Security Incident Response & Threat Mitigation Platform

---

## Context

Student C is responsible for the SOC (Security Operations Centre) Platform module of the SDA-Pro system. This includes the analyst dashboard, alert lifecycle management, event routing, and compliance audit logging. The module must support real-time alert ingestion, concurrent analyst access, and integration with the broader SDA-Pro platform.

## Decision

We adopt a **hybrid architecture** combining four complementary styles:

| Style | Applied To |
|---|---|
| **MVC (Model-View-Controller)** | REST API layer (controllers, services, repositories) |
| **Layered Architecture** | Internal module structure (controller → service → repository) |
| **Event-Driven Architecture (EDA)** | Alert routing, async processing via EventBus + RabbitMQ |
| **Service-Oriented Architecture (SOA)** | Multi-step orchestration pipeline (SOAOrchestrator) |

## Rationale

- **MVC** provides a clear separation between REST endpoints, business logic, and data access, making the codebase easy to navigate and test.
- **Layered Architecture** enforces strict dependency rules: controllers never access repositories directly, ensuring maintainability.
- **Event-Driven** architecture decouples alert ingestion from enrichment and notification — new alert types or processors can be added without modifying existing code (Open/Closed Principle).
- **SOA Orchestration** is needed for the 6-step alert pipeline (Ingest → Enrich → Correlate → Triage → Assign → Notify) which spans logically separate concerns.

## Consequences

**Positive:**
- Clear boundaries between ingestion, processing, and presentation layers.
- Event Bus allows async, non-blocking alert processing.
- SOA orchestration enables audit of each pipeline step independently.
- Easy to extend with new alert types, enrichment sources, or notification channels.

**Negative:**
- RabbitMQ introduces an external dependency (mitigated by local fallback in EventBus).
- SOA orchestration adds latency vs. a simple synchronous call (acceptable given security context).
