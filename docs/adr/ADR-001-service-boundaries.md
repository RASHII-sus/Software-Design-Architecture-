# ADR-001: Service Boundaries

## Status

Accepted

## Context

SDA-Pro must demonstrate SOA, MVC, layered architecture, and event-driven integration while dividing ownership across three students.

## Decision

Use a poly-repo-style monorepo with autonomous modules under `modules/`:

- `student-a`: alert ingestion, enrichment/correlation, incident lifecycle
- `student-b`: threat intelligence, response orchestration, notification, middleware
- `student-c`: SOC backend, dashboard, event bus, audit/compliance

Each runtime service keeps its own controllers, services, domain objects, repositories, configuration, tests, and Dockerfile.

## Consequences

This preserves clear ownership and service boundaries while allowing shared scripts and documentation at the repository root.
