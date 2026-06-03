# ADR-002: Design Pattern Selection

**Date:** 2024-01-20  
**Status:** Accepted  
**Author:** Student C – SOC Platform Engineer  
**Project:** SDA-Pro – Security Incident Response & Threat Mitigation Platform

---

## Context

The SOC Platform module requires patterns that support: a single dashboard aggregation entry point (Facade), real-time push on alert events (Observer), multi-step alert processing (Chain of Responsibility), interchangeable triage logic (Strategy), controlled singleton services (Singleton), and typed audit log creation (Factory).

## Decision

| Pattern | Class(es) | Justification |
|---|---|---|
| **Singleton** | `DashboardService`, `EventBus`, `SOAOrchestrator` | Spring `@Service`/`@Component` beans are singletons by default — single shared state for dashboard metrics and event subscriptions |
| **Observer** | `EventBus` (publisher) + `DashboardService.onAlertEvent()` (subscriber) | Dashboard auto-refreshes on every alert event without polling |
| **Facade** | `DashboardService.buildMetrics()`, `AuditService.generateComplianceReport()`, `SOAOrchestrator.orchestrate()` | Single methods hide multi-step aggregation/orchestration complexity from callers |
| **Factory Method** | `AuditService.logAlertAction()`, `logUserAccess()`, `logSystemEvent()` | Creates correctly-typed `AuditLog` instances without exposing construction logic |
| **Chain of Responsibility** | `AlertIngestionHandler` → `AlertEnrichmentHandler` → … → `AlertNotificationHandler` | Each step processes the alert and passes context to the next; steps are independently replaceable |
| **Strategy** | Enrichment and triage logic per severity level in handler chain | Different processing strategies are applied based on alert severity at runtime |

## Rationale

Each pattern was selected to solve a concrete problem in the SOC domain:

- Without **Observer**, the dashboard would need to poll the DB every second for changes — inefficient and un-real-time.
- Without **Facade**, callers of `DashboardService` would need to invoke 10+ methods and aggregate results themselves.
- Without **Chain of Responsibility**, the 6-step orchestration pipeline would be a monolithic method — untestable and unmaintainable.
- Without **Factory**, `AuditLog` creation would be duplicated across every service that logs an action.

## Consequences

- Patterns add abstraction layers; new developers must understand each pattern to navigate the codebase (mitigated by inline Javadoc in every class).
- The Chain of Responsibility adds handler classes (`AlertIngestionHandler`, etc.) but makes each step independently unit-testable.
