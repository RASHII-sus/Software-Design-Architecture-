# SDA-Pro Integration Platform

SDA - Pro is an integrated Security Detection and Automated Response demo. The workspace now keeps each student-owned subsystem intact under `modules/`, with shared operational scripts at the root and in `scripts/`.

## Repository Layout

```text
Sem-Project/
├── README.md
├── run-all.ps1                 # Compatibility wrapper for scripts/run-all.ps1
├── populate-data.ps1           # Compatibility wrapper for scripts/populate-data.ps1
├── scripts/
│   ├── run-all.ps1             # Unified launcher
│   ├── populate-data.ps1       # Demo data injector
│   └── integration-smoke.ps1   # Endpoint and sample-ingestion smoke check
├── docker-compose.yml          # Full integrated platform
├── Makefile                    # Convenience targets for compose workflows
├── docs/
│   ├── adr/                    # ADR-001 through ADR-005
│   ├── api/                    # REST service contracts
│   ├── events/                 # Domain event schemas
│   ├── uml/                    # PlantUML diagrams
│   └── requirements-crosscheck.md
└── modules/
    ├── student-a/              # Java/Spring threat pipeline
    │   ├── shared/
    │   └── services/
    │       ├── alert-ingestion-service/
    │       ├── enrichment-correlation-service/
    │       └── incident-management-service/
    ├── student-b/              # NestJS event-driven services
    │   ├── shared/
    │   ├── middleware/
    │   └── services/
    │       ├── threat-intel-service/
    │       ├── response-orchestration-service/
    │       └── notification-service/
    └── student-c/              # SOC backend and dashboard
        ├── src/
        └── frontend/
```

## Services

| Service | Port | Location |
| --- | ---: | --- |
| SOC Dashboard Frontend | `3000` | `modules/student-c/frontend` |
| SOC Platform Backend | `8084` | `modules/student-c` |
| Alert Ingestion | `8081` | `modules/student-a/services/alert-ingestion-service` |
| Enrichment and Correlation | `8082` | `modules/student-a/services/enrichment-correlation-service` |
| Incident Management | `8083` | `modules/student-a/services/incident-management-service` |
| Threat Intel Adapter | `3002` | `modules/student-b/services/threat-intel-service` |
| Response Orchestrator | `3003` | `modules/student-b/services/response-orchestration-service` |
| Notification Dispatch | `3004` | `modules/student-b/services/notification-service` |
| Middleware Pipeline | `3005` | `modules/student-b/middleware` |

## Quick Start

Prerequisites:

- Docker Desktop
- Java 17
- Node.js 18+
- PowerShell

From the repository root:

```powershell
.\run-all.ps1
```

Pick option `1` to start the full platform, or option `6` to run health checks.

The launcher resolves paths relative to this repository, so it no longer depends on a fixed drive such as `S:\Sem-Project`.

Docker Compose full-stack startup:

```powershell
docker compose up -d --build
.\scripts\integration-smoke.ps1 -InjectSampleAlert
```

With `make` available:

```bash
make up
make smoke
make populate
make down
```

## Demo Data

After the services are running:

```powershell
.\populate-data.ps1
```

This injects sample Splunk and CrowdStrike alerts, creates incidents, moves incidents through legal state transitions, and posts dashboard-facing alerts into the SOC backend.

## Subsystem Notes

Student A remains a Maven multi-module Spring Boot project with local SQLite databases and pattern-focused services.

Student B remains a NestJS service suite with Postgres, Redis, RabbitMQ, shared contracts, and Docker Compose infrastructure.

Student C remains the SOC platform backend plus the React dashboard. The frontend now uses Vite so the existing proxy configuration in `modules/student-c/frontend/vite.config.js` is active during local development.

## Documentation

- ADRs: `docs/adr/`
- UML diagrams: `docs/uml/`
- API contracts: `docs/api/service-contracts.md`
- Event schemas: `docs/events/event-schemas.md`
- Requirements cross-check: `docs/requirements-crosscheck.md`
