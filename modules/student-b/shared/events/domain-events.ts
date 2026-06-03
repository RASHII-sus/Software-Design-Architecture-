// shared/events/domain-events.ts
// All domain event schemas published to / consumed from RabbitMQ

import {
  CanonicalAlert,
  ReputationResult,
  ActionOutcome,
  NotificationPayload,
} from '../contracts/interfaces';
import {
  IncidentState,
  Severity,
  ResponseActionType,
  NotificationChannel,
} from '../contracts/enums';

// ─── Exchange & Routing Key Constants ─────────────────────────────────────────
export const EXCHANGES = {
  ALERTS: 'sda.alerts',
  INCIDENTS: 'sda.incidents',
  RESPONSES: 'sda.responses',
  NOTIFICATIONS: 'sda.notifications',
  THREAT_INTEL: 'sda.threat-intel',
  DEAD_LETTER: 'sda.dead-letter',
} as const;

export const ROUTING_KEYS = {
  ALERT_INGESTED: 'alert.ingested',
  ALERT_ENRICHED: 'alert.enriched',
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_STATE_CHANGED: 'incident.state.changed',
  RESPONSE_ACTION_EXECUTED: 'response.action.executed',
  THREAT_INTEL_UPDATED: 'threat-intel.updated',
  NOTIFICATION_DISPATCH: 'notification.dispatch',
} as const;

export const QUEUES = {
  ALERT_INGESTED: 'alert.ingested',
  ALERT_ENRICHED: 'alert.enriched',
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_STATE_CHANGED: 'incident.state.changed',
  RESPONSE_ACTION_EXECUTED: 'response.action.executed',
  THREAT_INTEL_UPDATED: 'threat-intel.updated',
  NOTIFICATION_DISPATCH: 'notification.dispatch',
  DEAD_LETTER: 'dead.letter',
} as const;

// ─── Base Domain Event ────────────────────────────────────────────────────────
export interface BaseDomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: string; // ISO-8601
  version: string;
  correlationId?: string;
  causationId?: string;
  source: string; // service name that emitted the event
}

// ─── Alert Events ─────────────────────────────────────────────────────────────
export interface AlertIngestedEvent extends BaseDomainEvent {
  eventType: 'AlertIngested';
  payload: {
    alertId: string;
    sourceType: string;
    severity: Severity;
    timestamp: string;
  };
}

export interface AlertEnrichedEvent extends BaseDomainEvent {
  eventType: 'AlertEnriched';
  payload: {
    alertId: string;
    enrichedAlert: CanonicalAlert;
    pipelineStages: string[];
    processingTimeMs: number;
  };
}

// ─── Incident Events ──────────────────────────────────────────────────────────
export interface IncidentCreatedEvent extends BaseDomainEvent {
  eventType: 'IncidentCreated';
  payload: {
    incidentId: string;
    severity: Severity;
    alertIds: string[];
    state: IncidentState;
    correlationRule?: string;
  };
}

export interface IncidentStateChangedEvent extends BaseDomainEvent {
  eventType: 'IncidentStateChanged';
  payload: {
    incidentId: string;
    previousState: IncidentState;
    newState: IncidentState;
    changedBy?: string;
    reason?: string;
  };
}

// ─── Response Events ──────────────────────────────────────────────────────────
export interface ResponseActionExecutedEvent extends BaseDomainEvent {
  eventType: 'ResponseActionExecuted';
  payload: {
    responsePlanId: string;
    incidentId: string;
    actions: ActionOutcome[];
    strategyUsed: string;
    allSuccessful: boolean;
    requiresEscalation: boolean;
  };
}

// ─── Threat Intel Events ──────────────────────────────────────────────────────
export interface ThreatIntelUpdatedEvent extends BaseDomainEvent {
  eventType: 'ThreatIntelUpdated';
  payload: {
    indicator: string;
    indicatorType: string;
    previousVerdict?: string;
    newVerdict: string;
    source: string;
    reputationResult: ReputationResult;
  };
}

// ─── Notification Events ──────────────────────────────────────────────────────
export interface NotificationDispatchEvent extends BaseDomainEvent {
  eventType: 'NotificationDispatch';
  payload: {
    triggeredBy: string; // e.g. 'ResponseActionExecuted', 'IncidentCreated'
    incidentId?: string;
    notifications: NotificationPayload[];
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

// ─── Union type of all domain events ─────────────────────────────────────────
export type DomainEvent =
  | AlertIngestedEvent
  | AlertEnrichedEvent
  | IncidentCreatedEvent
  | IncidentStateChangedEvent
  | ResponseActionExecutedEvent
  | ThreatIntelUpdatedEvent
  | NotificationDispatchEvent;
