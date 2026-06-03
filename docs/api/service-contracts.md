# SDA-Pro Service Contracts

## Alert Ingestion Service

Base URL: `http://localhost:8081/api/v1`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/ingest/{sourceType}` | Push/webhook ingestion for raw alert payloads |
| `POST` | `/poll/{sourceType}?batchSize=1` | Pull/polling ingestion for API-backed sources |
| `POST` | `/ingest/{sourceType}/campaign` | Create a composite campaign from raw payloads |
| `GET` | `/alerts` | List canonical alerts |
| `GET` | `/alerts/{id}` | Get a canonical alert |
| `GET` | `/alerts/campaigns` | List composite campaigns |
| `GET` | `/config` | Show ingestion config singleton state |

## Enrichment and Correlation Service

Base URL: `http://localhost:8082/api/v1`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/enrich` | Enrich one canonical alert |
| `POST` | `/enrich/batch` | Enrich and correlate multiple alerts |
| `GET` | `/enrichment-results` | List enrichment results |
| `GET` | `/enrichment-results/{alertId}` | Get enrichment by alert ID |

## Incident Management Service

Base URL: `http://localhost:8083/api/v1`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/incidents` | Create an incident |
| `GET` | `/incidents` | List incidents |
| `PUT` | `/incidents/{id}/triage` | Transition to under triage |
| `PUT` | `/incidents/{id}/contain` | Transition to containment |
| `PUT` | `/incidents/{id}/eradicate` | Transition to eradication |
| `PUT` | `/incidents/{id}/recover` | Transition to recovery |
| `PUT` | `/incidents/{id}/review` | Transition to post-incident review |
| `PUT` | `/incidents/{id}/close` | Close incident |

## Threat Intel Service

Base URL: `http://localhost:3002/api/v1`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/threat-intel/reputation` | Check one indicator |
| `POST` | `/threat-intel/reputation/bulk` | Check multiple indicators |
| `GET` | `/threat-intel/stats` | Cache and verdict statistics |
| `GET` | `/health` | Health check |

## Response Orchestration Service

Base URL: `http://localhost:3003/api/v1`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/response/assess` | Select strategy and execute response plan |
| `GET` | `/response/strategies` | List available strategies |
| `GET` | `/response/incidents/{incidentId}/history` | Response plan history |
| `POST` | `/response/plans/{planId}/rollback` | Roll back a response plan |
| `GET` | `/health` | Health check |

## Notification Service

Base URL: `http://localhost:3004/api/v1`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/notifications/dispatch` | Dispatch one notification |
| `POST` | `/notifications/incident-alert` | Dispatch incident alert to available channels |
| `GET` | `/notifications/tier` | Active notification factory tier |
| `GET` | `/notifications/stats` | Delivery statistics |
| `GET` | `/health` | Health check |

## SOC Platform Backend

Base URL: `http://localhost:8084`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/alerts` | Ingest dashboard alert |
| `GET` | `/api/alerts` | List dashboard alerts |
| `GET` | `/api/dashboard/metrics` | Dashboard metrics |
| `POST` | `/api/dashboard/refresh` | Force metrics refresh and WebSocket push |
| `GET` | `/api/audit/logs` | Audit log list |
| `GET` | `/actuator/health` | Health check |
