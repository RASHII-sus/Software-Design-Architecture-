# SDA-Pro — Security Incident Response & Threat Mitigation Platform

> Software Design & Architecture — Semester Project  
> **Student A: Threat Pipeline Engineer**

---

## 🏗️ Architecture Overview

SDA-Pro is a distributed Security Operations Center (SOC) platform built using **Service-Oriented Architecture (SOA)** with 12 design patterns, demonstrating mastery of software design principles.

### Student A Services

| Service | Port | Design Patterns |
|---------|------|----------------|
| **Alert Ingestion Service** | 8081 | Singleton, Factory Method, Composite |
| **Enrichment & Correlation Service** | 8082 | Chain of Responsibility, Abstract Factory, Strategy |
| **Incident Management Service** | 8083 | State |

### Architecture Styles Demonstrated
- **SOA**: Services communicate via REST APIs and domain events
- **Layered Architecture**: Each service follows Controller → Service → Repository → Domain
- **Event-Driven**: Services publish domain events via an in-memory event bus
- **MVC**: RESTful controllers follow Model-View-Controller separation

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose (optional)

### Run Locally (without Docker)

```bash
# 1. Build all modules
mvn clean install

# 2. Start Alert Ingestion Service
cd services/alert-ingestion-service
mvn spring-boot:run

# 3. Start Enrichment & Correlation Service (new terminal)
cd services/enrichment-correlation-service
mvn spring-boot:run

# 4. Start Incident Management Service (new terminal)
cd services/incident-management-service
mvn spring-boot:run
```

### Run with Docker Compose

```bash
docker-compose up --build
```

---

## 📡 API Endpoints

### Alert Ingestion Service (port 8081)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ingest/{sourceType}` | Ingest alert via webhook |
| POST | `/api/v1/ingest/{sourceType}/campaign` | Ingest alert campaign |
| GET | `/api/v1/alerts` | List all alerts |
| GET | `/api/v1/alerts/{id}` | Get alert by ID |
| GET | `/api/v1/alerts/campaigns` | List campaigns |
| GET | `/api/v1/config` | Get ingestion config (Singleton) |

### Enrichment & Correlation Service (port 8082)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/enrich` | Enrich single alert |
| POST | `/api/v1/enrich/batch` | Enrich and correlate batch |
| GET | `/api/v1/enrichment-results/{alertId}` | Get enrichment result |
| GET | `/api/v1/enrichment-results` | List all results |

### Incident Management Service (port 8083)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/incidents` | Create incident |
| GET | `/api/v1/incidents` | List incidents |
| GET | `/api/v1/incidents/{id}` | Get incident |
| PUT | `/api/v1/incidents/{id}/triage` | Begin triage |
| PUT | `/api/v1/incidents/{id}/contain` | Initiate containment |
| PUT | `/api/v1/incidents/{id}/eradicate` | Begin eradication |
| PUT | `/api/v1/incidents/{id}/recover` | Begin recovery |
| PUT | `/api/v1/incidents/{id}/review` | Start post-incident review |
| PUT | `/api/v1/incidents/{id}/close` | Close incident |
| POST | `/api/v1/incidents/{id}/escalate` | Escalate incident |

---

## 🎨 Design Pattern Annotations

All pattern implementations are annotated in code with:

```java
// PATTERN: PatternName
// RATIONALE: Why this pattern is used here
```

### Pattern Map

| # | Pattern | Location | Purpose |
|---|---------|----------|---------|
| 1 | **Singleton** | `IngestionConfigManager` | Single source of truth for ingestion configuration |
| 2 | **Factory Method** | `AlertNormalizerFactory` | Create source-specific normalizers (Splunk, CrowdStrike, Firewall) |
| 3 | **Composite** | `AlertComponent` tree | Uniform treatment of single alerts, campaigns, and clusters |
| 4 | **Chain of Responsibility** | `EnrichmentHandler` pipeline | Configurable enrichment pipeline with 5 handlers |
| 5 | **Abstract Factory** | `EnrichmentProviderFactory` | Create families of enrichment providers (Premium/Standard tiers) |
| 6 | **Strategy** | `CorrelationStrategy` | Interchangeable correlation algorithms |
| 7 | **State** | `IncidentState` lifecycle | 7-state incident lifecycle with state-specific behavior |

---

## 📁 Project Structure

```
SDA-Pro/
├── pom.xml                                    # Parent Maven POM
├── docker-compose.yml                         # Docker Compose
├── README.md
├── docs/
│   └── adr/                                   # Architecture Decision Records
│       ├── ADR-001-SOA-Architecture.md
│       └── ADR-003-Database-Strategy.md
├── shared/                                    # Cross-cutting libraries
│   └── src/main/java/com/sdapro/shared/
│       ├── commons/                           # Enums: Severity, AlertSourceType, etc.
│       ├── contracts/                         # DTOs: CanonicalAlert, EnrichmentResult
│       └── events/                            # Domain events + SimpleEventBus
├── services/
│   ├── alert-ingestion-service/               # Student A — Singleton, Factory, Composite
│   ├── enrichment-correlation-service/        # Student A — CoR, Abstract Factory, Strategy
│   └── incident-management-service/           # Student A — State
└── scripts/
    └── seed/                                  # Demo data
```

---

## 🧪 Testing

```bash
# Run all tests
mvn test

# Run tests for a specific service
cd services/alert-ingestion-service && mvn test
cd services/enrichment-correlation-service && mvn test
cd services/incident-management-service && mvn test
```

---

## 📄 Architecture Decision Records

- [ADR-001: SOA vs. Microservices vs. Modular Monolith](docs/adr/ADR-001-SOA-Architecture.md)
- [ADR-003: Database Strategy](docs/adr/ADR-003-Database-Strategy.md)

---

## 👥 Team

| Role | Student | Services |
|------|---------|----------|
| Threat Pipeline Engineer | **Student A** | Alert Ingestion, Enrichment & Correlation, Incident Management |
| Integration & Response Engineer | Student B | Response Orchestration, Threat Intel, Notification |
| SOC Platform Engineer | Student C | Dashboard, Event Bus, Audit, Identity |
