# ADR-003: Database Strategy

## Status

Accepted

## Context

The PDF recommends relational persistence for incidents and operational records, plus flexible handling of raw alert payloads.

## Decision

Use PostgreSQL for Student B and Student C integrated persistence. Use Redis for cache/rate-limit/dashboard cache concerns. Student A keeps local SQLite databases for its independently runnable Spring services and stores raw alert payloads alongside canonical alert entities.

## Consequences

The root Docker Compose provides PostgreSQL and Redis for integrated services. Student A remains lightweight for local pattern demos while still exposing REST APIs to the integrated platform.
