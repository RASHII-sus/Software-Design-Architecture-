# ADR-005: Real-Time Push Strategy

## Status

Accepted

## Context

SOC analysts need near-real-time alert and incident visibility. Polling the dashboard too frequently would be inefficient and less representative of an event-driven architecture.

## Decision

Use WebSocket/STOMP with SockJS on the Student C backend. `DashboardService` subscribes to `EventBus` events and pushes fresh metrics to `/topic/dashboard`.

## Consequences

The dashboard can update when alerts or incidents change. RabbitMQ is used for distributed event publishing, while local subscribers support same-JVM observer behavior and graceful fallback when RabbitMQ is unavailable.
