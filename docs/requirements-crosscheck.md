# SDA-Pro Requirements Cross-Check

Source requirements: `C:\Users\54381 Ahmad Arsalan\Downloads\ABDM\Documents\SDA-Pro.pdf`

Date checked: 2026-06-03

## Overall Status

The project substantially satisfies the semester project intent: it contains the three-student split, distributed services, all 12 required design patterns, MVC/dashboard work, event-bus logic, tests, Docker files, and demo scripts.

The main remaining gaps are final runtime proof and the optional/separate service interpretation for audit and identity. Root-level Docker Compose, Makefile, ADR-001 through ADR-005, UML/API contract folders, event schemas, pull ingestion support, and a smoke-test script have been added.

## Acceptance Criteria

| Requirement | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Alerts from 2+ sources are ingested and normalized | Met | `modules/student-a/services/alert-ingestion-service`, `SplunkNormalizer`, `CrowdStrikeNormalizer`, `FirewallNormalizer`, `PollingIngestionService` | Push/webhook ingestion and simulated pull/polling ingestion are both exposed. |
| Chain of Responsibility enrichment pipeline with 3+ handlers | Met | Student A enrichment handlers; Student B middleware handlers | Student A has Deduplication, GeoIP, ThreatIntel, AssetContext, Classification. Student B middleware has Deduplication, GeoIP, ThreatIntel, Classification. |
| Composite grouping into campaigns | Met | `AlertComponent`, `SingleAlert`, `AlertCampaign`, `IncidentCluster` | Campaign endpoint exists. IncidentCluster model/repository exists. |
| Incidents transition through lifecycle states with state-specific behavior | Met | `Incident`, `IncidentState`, concrete state classes, `IncidentController` | Legal transitions and allowed actions/transitions are exposed and tested. |
| At least 2 response strategies selectable and executable | Met | `AggressiveContainmentStrategy`, `BalancedResponseStrategy`, `ConservativeStrategy`, `WatchAndWaitStrategy` | Response facade executes selected actions. |
| At least 2 threat intel adapters via Proxy + Adapter | Met | `VirusTotalAdapter`, `MISPAdapter`, `CustomFeedAdapter`; `CachingProxy`, `RateLimitProxy`, `AccessControlProxy` | Default proxy chain wraps VirusTotal; direct source routing exists for other adapters. |
| Dashboard updates in real time via Observer/Event-Driven pattern | Mostly met | Student C `EventBus`, `DashboardService`, WebSocket `/topic/dashboard` | RabbitMQ publish plus local observer callbacks exist. Full cross-service event consumption still appears partial. |
| All 12 patterns identified in code with annotations | Met | `// PATTERN:` annotations across Student A, Student B, and Student C core classes | Student C annotations were made more explicit. |
| All 4 architecture styles documented with evidence | Met | Student READMEs plus root ADRs, UML, API contracts, and event schemas | Evidence now exists under root `docs/`. |
| System starts with `docker-compose up` and passes E2E integration test | Mostly met | Root `docker-compose.yml`, `scripts/integration-smoke.ps1`, Student B E2E spec | Compose and smoke-test artifacts exist; they still need to be run in a Docker-enabled environment for final proof. |

## Required Design Patterns

| Pattern | Status | Evidence |
| --- | --- | --- |
| Singleton | Met | Student A `IngestionConfigManager`, shared `SimpleEventBus`; Spring singleton beans in Student C |
| Factory Method | Met | Student A `AlertNormalizerFactory`; Student B `ResponseActionFactory`; Student C `AuditService` factory-style methods |
| Abstract Factory | Met | Student A `EnrichmentProviderFactory`; Student B notification factories |
| Composite | Met | Student A alert tree: `AlertComponent`, `SingleAlert`, `AlertCampaign`, `IncidentCluster` |
| Facade | Met | Student B `IncidentResponseFacade`; Student C `DashboardService` facade-style aggregation |
| Adapter | Met | Student B `VirusTotalAdapter`, `MISPAdapter`, `CustomFeedAdapter`; Student A normalizers act as source adapters |
| Decorator | Met | Student B `AuditLogDecorator`, `ApprovalGateDecorator`, `RollbackDecorator`, `MetricsDecorator` |
| Proxy | Met | Student B `CachingProxy`, `RateLimitProxy`, `AccessControlProxy` |
| State | Met | Student A incident lifecycle state classes |
| Chain of Responsibility | Met | Student A enrichment pipeline; Student B middleware pipeline; Student C orchestration handlers |
| Observer | Met | Student A `SimpleEventBus`; Student C event bus plus dashboard subscriber; Student B event publishers |
| Strategy | Met | Student A correlation strategies; Student B response strategies |

## Architecture Styles

| Style | Status | Evidence | Gap |
| --- | --- | --- | --- |
| SOA | Met | Multiple autonomous services under `modules/student-a`, `modules/student-b`, `modules/student-c` | Root-level service contract documentation is thin. |
| MVC | Mostly met | Student C controllers/models/services plus React dashboard | React is not organized into explicit `views/models/controllers` directories as the PDF sketch suggests. |
| Layered Architecture | Met | Controllers, services, repositories, domain/entities across Java and NestJS modules | Some service code is demo-oriented but layering is clear. |
| Event-Driven Architecture | Mostly met | RabbitMQ config, event publishers, Student C `EventBus` | Cross-language event schemas/subscribers are not fully centralized. |

## Documentation and Deliverables

| Deliverable | Status | Notes |
| --- | --- | --- |
| ADRs 001-005 | Met | Root ADRs added under `docs/adr`. |
| UML diagrams | Met | PlantUML component and sequence diagrams added under `docs/uml`. |
| API contracts | Met | Root service contract markdown added under `docs/api`. |
| Event schemas | Met | Root event schema markdown added under `docs/events`. |
| Docker Compose deployment | Met | Root `docker-compose.yml` added for the integrated platform. |
| Integration tests | Mostly met | Student B E2E spec plus root smoke script. A deeper all-module assertion suite can still be added later. |
| Pattern annotation convention | Met | Student C core classes now include exact `// PATTERN:` comments. |

## Recommended Fixes Before Final Submission

1. Run `docker compose up -d --build` on a Docker-enabled machine and capture a final smoke-test screenshot/log.
2. Decide whether the instructor expects separate `audit-service` and `identity-service` deployables. Current implementation keeps audit inside Student C and does not implement a standalone identity service.
3. Add a deeper all-module E2E assertion suite if time allows: ingest -> enrich -> incident -> response -> dashboard/audit.
4. Replace the Maven wrapper jars later if Maven Central access works in your environment. For now, `mvnw.cmd` falls back to installed Maven or Docker-based Maven.
