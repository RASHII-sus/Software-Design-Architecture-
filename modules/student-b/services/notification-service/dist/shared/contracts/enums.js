"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationStatus = exports.NotificationChannel = exports.IncidentState = exports.ResponsePlanStatus = exports.ResponseActionStatus = exports.ResponseActionType = exports.ThreatIntelSource = exports.Verdict = exports.IndicatorType = exports.AlertSourceType = exports.Severity = void 0;
var Severity;
(function (Severity) {
    Severity["CRITICAL"] = "CRITICAL";
    Severity["HIGH"] = "HIGH";
    Severity["MEDIUM"] = "MEDIUM";
    Severity["LOW"] = "LOW";
    Severity["INFORMATIONAL"] = "INFORMATIONAL";
})(Severity || (exports.Severity = Severity = {}));
var AlertSourceType;
(function (AlertSourceType) {
    AlertSourceType["SPLUNK"] = "SPLUNK";
    AlertSourceType["CROWDSTRIKE"] = "CROWDSTRIKE";
    AlertSourceType["FIREWALL"] = "FIREWALL";
    AlertSourceType["CLOUD_SIEM"] = "CLOUD_SIEM";
    AlertSourceType["THREAT_FEED"] = "THREAT_FEED";
    AlertSourceType["MANUAL"] = "MANUAL";
})(AlertSourceType || (exports.AlertSourceType = AlertSourceType = {}));
var IndicatorType;
(function (IndicatorType) {
    IndicatorType["IP"] = "IP";
    IndicatorType["DOMAIN"] = "DOMAIN";
    IndicatorType["FILE_HASH"] = "FILE_HASH";
    IndicatorType["URL"] = "URL";
    IndicatorType["EMAIL"] = "EMAIL";
})(IndicatorType || (exports.IndicatorType = IndicatorType = {}));
var Verdict;
(function (Verdict) {
    Verdict["MALICIOUS"] = "MALICIOUS";
    Verdict["SUSPICIOUS"] = "SUSPICIOUS";
    Verdict["CLEAN"] = "CLEAN";
    Verdict["UNKNOWN"] = "UNKNOWN";
})(Verdict || (exports.Verdict = Verdict = {}));
var ThreatIntelSource;
(function (ThreatIntelSource) {
    ThreatIntelSource["VIRUSTOTAL"] = "VIRUSTOTAL";
    ThreatIntelSource["MISP"] = "MISP";
    ThreatIntelSource["CUSTOM_FEED"] = "CUSTOM_FEED";
})(ThreatIntelSource || (exports.ThreatIntelSource = ThreatIntelSource = {}));
var ResponseActionType;
(function (ResponseActionType) {
    ResponseActionType["BLOCK_IP"] = "BLOCK_IP";
    ResponseActionType["ISOLATE_ENDPOINT"] = "ISOLATE_ENDPOINT";
    ResponseActionType["DISABLE_USER"] = "DISABLE_USER";
    ResponseActionType["QUARANTINE_FILE"] = "QUARANTINE_FILE";
    ResponseActionType["ESCALATE"] = "ESCALATE";
})(ResponseActionType || (exports.ResponseActionType = ResponseActionType = {}));
var ResponseActionStatus;
(function (ResponseActionStatus) {
    ResponseActionStatus["PENDING"] = "PENDING";
    ResponseActionStatus["APPROVED"] = "APPROVED";
    ResponseActionStatus["EXECUTING"] = "EXECUTING";
    ResponseActionStatus["SUCCESS"] = "SUCCESS";
    ResponseActionStatus["FAILED"] = "FAILED";
    ResponseActionStatus["ROLLED_BACK"] = "ROLLED_BACK";
})(ResponseActionStatus || (exports.ResponseActionStatus = ResponseActionStatus = {}));
var ResponsePlanStatus;
(function (ResponsePlanStatus) {
    ResponsePlanStatus["PENDING"] = "PENDING";
    ResponsePlanStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ResponsePlanStatus["COMPLETED"] = "COMPLETED";
    ResponsePlanStatus["FAILED"] = "FAILED";
    ResponsePlanStatus["ROLLED_BACK"] = "ROLLED_BACK";
})(ResponsePlanStatus || (exports.ResponsePlanStatus = ResponsePlanStatus = {}));
var IncidentState;
(function (IncidentState) {
    IncidentState["NEW"] = "NEW";
    IncidentState["UNDER_TRIAGE"] = "UNDER_TRIAGE";
    IncidentState["CONTAINMENT"] = "CONTAINMENT";
    IncidentState["ERADICATION"] = "ERADICATION";
    IncidentState["RECOVERY"] = "RECOVERY";
    IncidentState["POST_INCIDENT_REVIEW"] = "POST_INCIDENT_REVIEW";
    IncidentState["CLOSED"] = "CLOSED";
})(IncidentState || (exports.IncidentState = IncidentState = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SLACK"] = "SLACK";
    NotificationChannel["PAGERDUTY"] = "PAGERDUTY";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "PENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["FAILED"] = "FAILED";
    NotificationStatus["RETRYING"] = "RETRYING";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
//# sourceMappingURL=enums.js.map