# ADR-003: Technology Stack Selection

**Date:** 2024-01-22  
**Status:** Accepted  
**Author:** Student C – SOC Platform Engineer  
**Project:** SDA-Pro – Security Incident Response & Threat Mitigation Platform

---

## Context

Student C needs a backend stack capable of handling real-time WebSocket push, asynchronous message queuing, distributed caching, and a reactive React dashboard. The stack must integrate with the rest of the SDA-Pro platform (also Java/Spring).

## Decision

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Language | Java | 17 LTS | Team standard; records, sealed classes, modern syntax |
| Framework | Spring Boot | 3.2.0 | Fastest path to production-ready REST + WebSocket + JPA |
| Database | PostgreSQL | 15 | ACID compliance needed for audit logs; JSON column support |
| Cache | Redis | 7 | Sub-millisecond dashboard metrics cache (5-min TTL) |
| Message Broker | RabbitMQ | 3 | Event Bus backbone; durable queues for alert + incident events |
| WebSocket | STOMP over SockJS | — | Real-time dashboard push; graceful fallback for older browsers |
| Security | Spring Security + JWT | — | Stateless auth for REST APIs; role-based access (SOC_ANALYST, SOC_MANAGER, ADMIN) |
| ORM | Spring Data JPA / Hibernate | — | Type-safe queries; auto DDL for dev |
| Frontend | React + Recharts | 18 | Component-based dashboard; Recharts for SOC analytics charts |
| Build | Maven | 3.9 | Team standard; Spring Boot Maven Plugin for fat JAR |
| CI/CD | GitHub Actions | — | Automated test + build + Docker on every push to main |
| Containerisation | Docker + Docker Compose | — | Reproducible local dev; PostgreSQL + Redis + RabbitMQ in one command |
| Testing | JUnit 5 + Mockito + H2 | — | Unit and integration tests; H2 in-memory for CI without external services |

## Consequences

**Positive:**
- Spring Boot + PostgreSQL + Redis is a well-understood, heavily documented stack.
- RabbitMQ provides durable message delivery even if the app restarts mid-alert.
- H2 test profile means CI runs with zero external dependencies.

**Negative:**
- Three additional services (Postgres, Redis, RabbitMQ) must be running for local dev — mitigated by `docker-compose up`.
- RabbitMQ and Redis add memory overhead on dev machines.
