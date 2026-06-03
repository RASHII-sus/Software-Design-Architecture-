# SDA-Pro Event Schemas

## AlertIngested

Publisher: Alert Ingestion

Subscribers: Enrichment, Dashboard, Audit

```json
{
  "eventType": "AlertIngested",
  "alertId": "uuid",
  "title": "string",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "sourceType": "SPLUNK|CROWDSTRIKE|FIREWALL|CLOUD_SIEM",
  "campaign": false,
  "occurredAt": "ISO-8601 timestamp"
}
```

## AlertEnriched

Publisher: Enrichment and Correlation

Subscribers: Dashboard, Audit, Correlation

```json
{
  "eventType": "AlertEnriched",
  "alertId": "uuid",
  "status": "COMPLETE|PARTIAL|DUPLICATE_SKIPPED",
  "handlerChainSummary": "string",
  "occurredAt": "ISO-8601 timestamp"
}
```

## IncidentCreated

Publisher: Incident Management

Subscribers: Dashboard, Notification, Response Orchestration

```json
{
  "eventType": "IncidentCreated",
  "incidentId": "uuid",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "alertCount": 1,
  "title": "string",
  "occurredAt": "ISO-8601 timestamp"
}
```

## IncidentStateChanged

Publisher: Incident Management

Subscribers: Dashboard, Audit, Metrics

```json
{
  "eventType": "IncidentStateChanged",
  "incidentId": "uuid",
  "previousState": "NEW",
  "newState": "UNDER_TRIAGE",
  "triggeredBy": "string",
  "reason": "string",
  "occurredAt": "ISO-8601 timestamp"
}
```

## ResponseActionExecuted

Publisher: Response Orchestration

Subscribers: Dashboard, Audit, Notification

```json
{
  "eventType": "ResponseActionExecuted",
  "incidentId": "uuid",
  "responsePlanId": "uuid",
  "strategyName": "BalancedResponseStrategy",
  "actions": [
    {
      "actionType": "BLOCK_IP",
      "status": "SUCCESS",
      "success": true,
      "message": "string"
    }
  ],
  "occurredAt": "ISO-8601 timestamp"
}
```

## ThreatIntelUpdated

Publisher: Threat Intel

Subscribers: Enrichment, Cache Invalidation

```json
{
  "eventType": "ThreatIntelUpdated",
  "indicator": "string",
  "indicatorType": "IP|DOMAIN|FILE_HASH|URL",
  "verdict": "MALICIOUS|SUSPICIOUS|CLEAN|UNKNOWN",
  "source": "VIRUSTOTAL|MISP|CUSTOM_FEED",
  "occurredAt": "ISO-8601 timestamp"
}
```
