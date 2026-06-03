"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUES = exports.ROUTING_KEYS = exports.EXCHANGES = void 0;
exports.EXCHANGES = {
    ALERTS: 'sda.alerts',
    INCIDENTS: 'sda.incidents',
    RESPONSES: 'sda.responses',
    NOTIFICATIONS: 'sda.notifications',
    THREAT_INTEL: 'sda.threat-intel',
    DEAD_LETTER: 'sda.dead-letter',
};
exports.ROUTING_KEYS = {
    ALERT_INGESTED: 'alert.ingested',
    ALERT_ENRICHED: 'alert.enriched',
    INCIDENT_CREATED: 'incident.created',
    INCIDENT_STATE_CHANGED: 'incident.state.changed',
    RESPONSE_ACTION_EXECUTED: 'response.action.executed',
    THREAT_INTEL_UPDATED: 'threat-intel.updated',
    NOTIFICATION_DISPATCH: 'notification.dispatch',
};
exports.QUEUES = {
    ALERT_INGESTED: 'alert.ingested',
    ALERT_ENRICHED: 'alert.enriched',
    INCIDENT_CREATED: 'incident.created',
    INCIDENT_STATE_CHANGED: 'incident.state.changed',
    RESPONSE_ACTION_EXECUTED: 'response.action.executed',
    THREAT_INTEL_UPDATED: 'threat-intel.updated',
    NOTIFICATION_DISPATCH: 'notification.dispatch',
    DEAD_LETTER: 'dead.letter',
};
//# sourceMappingURL=domain-events.js.map