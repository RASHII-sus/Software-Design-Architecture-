// shared/contracts/enums.ts
// Canonical enums shared across all SDA-Pro services

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

export enum AlertSourceType {
  SPLUNK = 'SPLUNK',
  CROWDSTRIKE = 'CROWDSTRIKE',
  FIREWALL = 'FIREWALL',
  CLOUD_SIEM = 'CLOUD_SIEM',
  THREAT_FEED = 'THREAT_FEED',
  MANUAL = 'MANUAL',
}

export enum IndicatorType {
  IP = 'IP',
  DOMAIN = 'DOMAIN',
  FILE_HASH = 'FILE_HASH',
  URL = 'URL',
  EMAIL = 'EMAIL',
}

export enum Verdict {
  MALICIOUS = 'MALICIOUS',
  SUSPICIOUS = 'SUSPICIOUS',
  CLEAN = 'CLEAN',
  UNKNOWN = 'UNKNOWN',
}

export enum ThreatIntelSource {
  VIRUSTOTAL = 'VIRUSTOTAL',
  MISP = 'MISP',
  CUSTOM_FEED = 'CUSTOM_FEED',
}

export enum ResponseActionType {
  BLOCK_IP = 'BLOCK_IP',
  ISOLATE_ENDPOINT = 'ISOLATE_ENDPOINT',
  DISABLE_USER = 'DISABLE_USER',
  QUARANTINE_FILE = 'QUARANTINE_FILE',
  ESCALATE = 'ESCALATE',
}

export enum ResponseActionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXECUTING = 'EXECUTING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum ResponsePlanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum IncidentState {
  NEW = 'NEW',
  UNDER_TRIAGE = 'UNDER_TRIAGE',
  CONTAINMENT = 'CONTAINMENT',
  ERADICATION = 'ERADICATION',
  RECOVERY = 'RECOVERY',
  POST_INCIDENT_REVIEW = 'POST_INCIDENT_REVIEW',
  CLOSED = 'CLOSED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  PAGERDUTY = 'PAGERDUTY',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}
