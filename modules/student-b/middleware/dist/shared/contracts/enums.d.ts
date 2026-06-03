export declare enum Severity {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
    INFORMATIONAL = "INFORMATIONAL"
}
export declare enum AlertSourceType {
    SPLUNK = "SPLUNK",
    CROWDSTRIKE = "CROWDSTRIKE",
    FIREWALL = "FIREWALL",
    CLOUD_SIEM = "CLOUD_SIEM",
    THREAT_FEED = "THREAT_FEED",
    MANUAL = "MANUAL"
}
export declare enum IndicatorType {
    IP = "IP",
    DOMAIN = "DOMAIN",
    FILE_HASH = "FILE_HASH",
    URL = "URL",
    EMAIL = "EMAIL"
}
export declare enum Verdict {
    MALICIOUS = "MALICIOUS",
    SUSPICIOUS = "SUSPICIOUS",
    CLEAN = "CLEAN",
    UNKNOWN = "UNKNOWN"
}
export declare enum ThreatIntelSource {
    VIRUSTOTAL = "VIRUSTOTAL",
    MISP = "MISP",
    CUSTOM_FEED = "CUSTOM_FEED"
}
export declare enum ResponseActionType {
    BLOCK_IP = "BLOCK_IP",
    ISOLATE_ENDPOINT = "ISOLATE_ENDPOINT",
    DISABLE_USER = "DISABLE_USER",
    QUARANTINE_FILE = "QUARANTINE_FILE",
    ESCALATE = "ESCALATE"
}
export declare enum ResponseActionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    EXECUTING = "EXECUTING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    ROLLED_BACK = "ROLLED_BACK"
}
export declare enum ResponsePlanStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    ROLLED_BACK = "ROLLED_BACK"
}
export declare enum IncidentState {
    NEW = "NEW",
    UNDER_TRIAGE = "UNDER_TRIAGE",
    CONTAINMENT = "CONTAINMENT",
    ERADICATION = "ERADICATION",
    RECOVERY = "RECOVERY",
    POST_INCIDENT_REVIEW = "POST_INCIDENT_REVIEW",
    CLOSED = "CLOSED"
}
export declare enum NotificationChannel {
    EMAIL = "EMAIL",
    SLACK = "SLACK",
    PAGERDUTY = "PAGERDUTY"
}
export declare enum NotificationStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED",
    RETRYING = "RETRYING"
}
