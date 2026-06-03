import { CanonicalAlert, ReputationResult, ActionOutcome, NotificationPayload } from '../contracts/interfaces';
import { IncidentState, Severity } from '../contracts/enums';
export declare const EXCHANGES: {
    readonly ALERTS: "sda.alerts";
    readonly INCIDENTS: "sda.incidents";
    readonly RESPONSES: "sda.responses";
    readonly NOTIFICATIONS: "sda.notifications";
    readonly THREAT_INTEL: "sda.threat-intel";
    readonly DEAD_LETTER: "sda.dead-letter";
};
export declare const ROUTING_KEYS: {
    readonly ALERT_INGESTED: "alert.ingested";
    readonly ALERT_ENRICHED: "alert.enriched";
    readonly INCIDENT_CREATED: "incident.created";
    readonly INCIDENT_STATE_CHANGED: "incident.state.changed";
    readonly RESPONSE_ACTION_EXECUTED: "response.action.executed";
    readonly THREAT_INTEL_UPDATED: "threat-intel.updated";
    readonly NOTIFICATION_DISPATCH: "notification.dispatch";
};
export declare const QUEUES: {
    readonly ALERT_INGESTED: "alert.ingested";
    readonly ALERT_ENRICHED: "alert.enriched";
    readonly INCIDENT_CREATED: "incident.created";
    readonly INCIDENT_STATE_CHANGED: "incident.state.changed";
    readonly RESPONSE_ACTION_EXECUTED: "response.action.executed";
    readonly THREAT_INTEL_UPDATED: "threat-intel.updated";
    readonly NOTIFICATION_DISPATCH: "notification.dispatch";
    readonly DEAD_LETTER: "dead.letter";
};
export interface BaseDomainEvent {
    eventId: string;
    eventType: string;
    occurredAt: string;
    version: string;
    correlationId?: string;
    causationId?: string;
    source: string;
}
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
export interface NotificationDispatchEvent extends BaseDomainEvent {
    eventType: 'NotificationDispatch';
    payload: {
        triggeredBy: string;
        incidentId?: string;
        notifications: NotificationPayload[];
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
    };
}
export type DomainEvent = AlertIngestedEvent | AlertEnrichedEvent | IncidentCreatedEvent | IncidentStateChangedEvent | ResponseActionExecutedEvent | ThreatIntelUpdatedEvent | NotificationDispatchEvent;
