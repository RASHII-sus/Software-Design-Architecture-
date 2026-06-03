package com.sdapro.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * AuditLog Entity - tracks all security-relevant actions for compliance.
 * GDPR / ISO27001 / SOC2 compliant audit trail.
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String eventType;       // ALERT_CREATED, INCIDENT_ESCALATED, etc.

    @Column(nullable = false)
    private String action;          // CREATE, UPDATE, DELETE, ESCALATE, RESOLVE

    @Column(nullable = false)
    private String performedBy;     // username or system

    private String targetEntityId;  // which alert/incident was affected

    private String targetEntityType;// AlertEvent, Incident, User

    @Column(length = 4000)
    private String details;         // JSON payload of what changed

    private String ipAddress;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ComplianceFlag complianceFlag;  // GDPR, ISO27001, SOC2, NONE

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
        if (complianceFlag == null) complianceFlag = ComplianceFlag.NONE;
    }

    public enum ComplianceFlag {
        NONE, GDPR, ISO27001, SOC2, PCI_DSS, HIPAA
    }
}
