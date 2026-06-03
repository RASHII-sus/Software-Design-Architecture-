# ADR-003: Database Strategy

## Status
**Accepted**

## Date
2026-06-02

## Context
SDA-Pro services require persistent storage for alerts, enrichment results, incidents, and audit logs. The project guide recommends PostgreSQL (relational) + Redis (caching). However, for a semester project with local development focus, we need a pragmatic database strategy that balances simplicity with architectural correctness.

## Decision
We chose **SQLite** for development with a clear upgrade path to **PostgreSQL** for production deployment.

### Rationale

1. **Zero infrastructure overhead**: SQLite is an embedded database requiring no server process, no Docker container, and no configuration. Students can `git clone` and `mvn spring-boot:run` immediately.

2. **JPA abstraction layer**: By using Spring Data JPA with Hibernate, our entity mappings and repository interfaces are database-agnostic. Switching to PostgreSQL requires only changing the JDBC URL and dialect in `application.yml`.

3. **Per-service databases**: Each SOA service has its own SQLite file (`alert-ingestion.db`, `enrichment.db`, `incident-management.db`), demonstrating true SOA data autonomy without the operational overhead of 3 PostgreSQL instances.

4. **Sufficient for demonstration**: SQLite handles the read/write volumes of a demo SOC platform (hundreds of alerts, not millions). Our acceptance criteria don't require concurrent multi-user performance.

### Upgrade Path to PostgreSQL
```yaml
# Development (SQLite)
spring:
  datasource:
    url: jdbc:sqlite:./data/service.db
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.community.dialect.SQLiteDialect

# Production (PostgreSQL)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/sdapro
    username: sdapro
    password: ${DB_PASSWORD}
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

## Consequences
### Positive
- Instant setup — no database server installation required.
- Each service's data is isolated in its own file.
- Full JPA/Hibernate ORM capabilities (entities, relationships, queries).
- Trivial migration to PostgreSQL via configuration change.

### Negative
- SQLite doesn't support true concurrent writes (uses file-level locking).
- No stored procedures, triggers, or advanced PostgreSQL features.
- No Redis caching — using in-memory `ConcurrentHashMap` instead (sufficient for demo).

### Mitigations
- Alert deduplication uses `ConcurrentHashMap` as an in-memory cache (replaces Redis for demo).
- Threat intel caching uses similar in-memory approach.
- Docker Compose configuration includes PostgreSQL as a commented-out alternative.
