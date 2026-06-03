# ADR-002: Synchronous and Asynchronous Communication

## Status

Accepted

## Context

The platform needs request/response APIs for analyst workflows and asynchronous updates for alert, incident, response, notification, and dashboard events.

## Decision

Use REST for direct commands and queries. Use RabbitMQ plus local observer callbacks for event-driven updates.

Synchronous examples:

- Dashboard to incident management
- Response orchestration to threat intelligence
- Response orchestration to notification dispatch

Asynchronous examples:

- Alert created
- Alert enriched
- Incident state changed
- Response action executed
- Threat intel updated

## Consequences

REST keeps demos and tests simple. RabbitMQ preserves loose coupling for cross-service events and real-time dashboard updates.
