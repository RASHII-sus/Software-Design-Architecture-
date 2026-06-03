# SDA-Pro – Student C: SOC Platform Engineer

**Security Incident Response & Threat Mitigation Platform**  
Module: SOC Analyst Dashboard · Event Bus · SOA Orchestration · Audit & Compliance

---

## Architecture Overview

| Concern | Style / Pattern | Implementation |
|---|---|---|
| REST API layer | MVC | `AlertController`, `DashboardController`, `AuditController` |
| Internal structure | Layered Architecture | Controller → Service → Repository |
| Alert routing | Event-Driven Architecture | `EventBus` + RabbitMQ |
| Alert pipeline | SOA Orchestration | `SOAOrchestrator` (6-step) |
| Dashboard aggregation | Facade | `DashboardService.buildMetrics()` |
| Real-time updates | Observer | `EventBus` → `DashboardService.onAlertEvent()` |
| Audit log creation | Factory Method | `AuditService.logAlertAction/UserAccess/SystemEvent()` |
| Pipeline steps | Chain of Responsibility | `AlertIngestion→Enrichment→Correlation→Triage→Assignment→Notification` |
| Per-severity logic | Strategy | Handler chain strategies per `Severity` |
| Shared beans | Singleton | Spring `@Service`/`@Component` |
| Metrics cache | Redis | 5-minute TTL, auto-evict on alert events |
| Live dashboard | WebSocket (STOMP/SockJS) | `/topic/dashboard` push |

---

## Quick Start

### Option 1 – Docker Compose (recommended)

```bash
# 1. Start all services (PostgreSQL, Redis, RabbitMQ, App)
docker-compose up --build

# 2. API available at:  http://localhost:8080
# 3. RabbitMQ UI at:    http://localhost:15672  (guest / guest)
```

### Option 2 – Local (requires PostgreSQL + Redis + RabbitMQ running)

```bash
# Build and run
./mvnw spring-boot:run

# Or with Maven directly
mvn spring-boot:run
```

### Option 3 – Run tests only (no external services needed)

```bash
mvn test -Dspring.profiles.active=test
```

---

## API Endpoints

### Alerts  `/api/alerts`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/alerts` | Ingest new alert (triggers SOA pipeline) | SOC_ANALYST+ |
| `GET` | `/api/alerts` | List all alerts | SOC_ANALYST+ |
| `GET` | `/api/alerts/{id}` | Get alert by ID | SOC_ANALYST+ |
| `GET` | `/api/alerts/status/{status}` | Filter by lifecycle status | SOC_ANALYST+ |
| `GET` | `/api/alerts/open-priority` | Open alerts sorted by priority | SOC_ANALYST+ |
| `PUT` | `/api/alerts/{id}/escalate?status=CONTAINMENT` | Escalate to next lifecycle stage | SOC_ANALYST+ |
| `PUT` | `/api/alerts/{id}/resolve` | Resolve and close alert | SOC_ANALYST+ |
| `DELETE` | `/api/alerts/{id}` | Delete alert | ADMIN only |

### Dashboard  `/api/dashboard`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/dashboard/metrics` | Full SOC dashboard metrics (Redis cached) | SOC_ANALYST+ |
| `GET` | `/api/dashboard/metrics/{severity}` | Metrics filtered by severity | SOC_ANALYST+ |
| `GET` | `/api/dashboard/critical` | Top 10 open CRITICAL/HIGH alerts | SOC_ANALYST+ |
| `POST` | `/api/dashboard/refresh` | Force cache eviction + WebSocket push | SOC_MANAGER+ |
| `GET` | `/api/dashboard/health` | Service health check | Public |

### Audit  `/api/audit`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/audit/logs` | All audit logs | SOC_MANAGER+ |
| `GET` | `/api/audit/logs/user/{username}` | Logs by analyst | SOC_MANAGER+ |
| `GET` | `/api/audit/logs/alert/{alertId}` | Logs for a specific alert | SOC_ANALYST+ |
| `GET` | `/api/audit/logs/compliance/{flag}` | GDPR / ISO27001 / SOC2 filtered logs | SOC_MANAGER+ |
| `GET` | `/api/audit/logs/recent?hours=24` | Recent logs (last N hours) | SOC_ANALYST+ |
| `GET` | `/api/audit/compliance-report?from=…&to=…` | Full compliance report | SOC_MANAGER+ |

---

## Design Pattern Map

```
POST /api/alerts
    │
    ▼
AlertController                         ← MVC: Controller layer
    │
    ▼
SOAOrchestrator.orchestrate()           ← Facade + SOA Orchestration
    │
    ├─ AlertIngestionHandler.handle()   ─┐
    ├─ AlertEnrichmentHandler.handle()   │  Chain of Responsibility
    ├─ AlertCorrelationHandler.handle()  │  (per-severity Strategy)
    ├─ AlertTriageHandler.handle()       │
    ├─ AlertAssignmentHandler.handle()   │
    └─ AlertNotificationHandler.handle()─┘
    │
    ▼
EventBus.publishAlertEvent()            ← Event-Driven (Observer publish)
    │
    ├─ RabbitMQ (distributed)
    └─ notifyLocalSubscribers()
           │
           ▼
    DashboardService.onAlertEvent()     ← Observer callback
           │
           ├─ evictDashboardCache()     ← Redis cache eviction
           └─ pushLiveMetrics()         ← WebSocket push → /topic/dashboard
                   │
                   ▼
           buildMetrics()               ← Facade: hides aggregation
           (Singleton bean instance)    ← Singleton pattern
```

---

## Project Structure

```
sda-pro-studentc/
├── src/
│   ├── main/
│   │   ├── java/com/sdapro/
│   │   │   ├── SdaProApplication.java          # Entry point
│   │   │   ├── controller/
│   │   │   │   ├── AlertController.java         # MVC: alert REST API
│   │   │   │   ├── DashboardController.java     # MVC: dashboard REST API
│   │   │   │   └── AuditController.java         # MVC: audit REST API
│   │   │   ├── service/
│   │   │   │   ├── DashboardService.java        # Singleton + Observer + Facade
│   │   │   │   └── AuditService.java            # Factory + Facade
│   │   │   ├── orchestration/
│   │   │   │   ├── SOAOrchestrator.java         # SOA + Facade
│   │   │   │   ├── OrchestrationContext.java    # Pipeline state carrier
│   │   │   │   └── ChainHandlers.java           # Chain of Responsibility + Strategy
│   │   │   ├── event/
│   │   │   │   ├── EventBus.java                # Observer (publisher) + EDA
│   │   │   │   └── SocEvent.java                # Event payload DTO
│   │   │   ├── model/
│   │   │   │   ├── AlertEvent.java              # JPA entity: security alert
│   │   │   │   ├── AlertEventRepository.java    # Spring Data repository
│   │   │   │   ├── AuditLog.java                # JPA entity: compliance log
│   │   │   │   └── AuditLogRepository.java      # Spring Data repository
│   │   │   ├── dto/
│   │   │   │   ├── AlertEventDTO.java           # Alert request/response DTO
│   │   │   │   └── DashboardMetricsDTO.java     # Dashboard metrics DTO
│   │   │   └── config/
│   │   │       ├── RabbitMQConfig.java          # Queue/exchange declarations
│   │   │       ├── SecurityConfig.java          # JWT + role-based access
│   │   │       └── WebSocketConfig.java         # STOMP WebSocket endpoint
│   │   └── resources/
│   │       ├── application.properties           # PostgreSQL + Redis + RabbitMQ config
│   │       └── application-test.properties      # H2 in-memory test profile
│   └── test/
│       └── java/com/sdapro/
│           ├── DashboardServiceTest.java
│           └── AuditServiceTest.java
├── frontend/
│   ├── src/
│   │   └── SOCDashboard.jsx                     # React SOC Dashboard
│   └── package.json
├── docs/
│   └── adr/
│       ├── ADR-001-architecture-style.md
│       ├── ADR-002-design-patterns.md
│       └── ADR-003-tech-stack.md
├── .github/
│   └── workflows/
│       └── ci.yml                               # GitHub Actions CI/CD
├── docker-compose.yml                           # Full stack: app + postgres + redis + rabbitmq
├── Dockerfile                                   # Multi-stage build
├── pom.xml
├── mvnw / mvnw.cmd
└── README.md
```

---

## Alert Lifecycle

```
NEW → UNDER_TRIAGE → CONTAINMENT → ERADICATION → RECOVERY → POST_INCIDENT_REVIEW → CLOSED
```

Each transition is triggered via `PUT /api/alerts/{id}/escalate?status=<next>` and published to the Event Bus.

---

## Testing

```bash
# All tests (H2 in-memory, no external services needed)
mvn test -Dspring.profiles.active=test

# Specific test class
mvn test -Dtest=DashboardServiceTest
mvn test -Dtest=AuditServiceTest
```

| Test File | Covers |
|---|---|
| `DashboardServiceTest.java` | Metrics aggregation, cache logic, Observer callback |
| `AuditServiceTest.java` | Factory methods, compliance flag assignment, report generation |

---

## Environment Variables (Docker)

| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/sdapro` | PostgreSQL URL |
| `SPRING_DATASOURCE_USERNAME` | `sdauser` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | `sdapassword` | DB password |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_RABBITMQ_HOST` | `localhost` | RabbitMQ host |
| `APP_JWT_SECRET` | *(see application.properties)* | JWT signing key |

---

## Team

| Role | Module | Student |
|---|---|---|
| SOC Platform Engineer | SOC Dashboard, Event Bus, SOA Orchestration, Audit | **Student C** |

---

## Architecture Decision Records

- [ADR-001 – Architecture Style Selection](docs/adr/ADR-001-architecture-style.md)
- [ADR-002 – Design Pattern Selection](docs/adr/ADR-002-design-patterns.md)
- [ADR-003 – Technology Stack Selection](docs/adr/ADR-003-tech-stack.md)
