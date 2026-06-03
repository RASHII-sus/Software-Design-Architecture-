package com.sdapro.dto;

import com.sdapro.model.AlertEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * AlertEventDTO - data transfer object for AlertEvent REST API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertEventDTO {

    private Long id;

    @NotBlank(message = "Alert ID is required")
    private String alertId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Severity is required")
    private AlertEvent.Severity severity;

    private AlertEvent.AlertStatus status;

    @NotBlank(message = "Source IP is required")
    private String sourceIp;

    private String destinationIp;
    private String attackType;
    private String description;
    private String assignedAnalyst;
    private LocalDateTime detectedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    /** Convert from entity to DTO */
    public static AlertEventDTO fromEntity(AlertEvent e) {
        return AlertEventDTO.builder()
                .id(e.getId())
                .alertId(e.getAlertId())
                .title(e.getTitle())
                .severity(e.getSeverity())
                .status(e.getStatus())
                .sourceIp(e.getSourceIp())
                .destinationIp(e.getDestinationIp())
                .attackType(e.getAttackType())
                .description(e.getDescription())
                .assignedAnalyst(e.getAssignedAnalyst())
                .detectedAt(e.getDetectedAt())
                .resolvedAt(e.getResolvedAt())
                .createdAt(e.getCreatedAt())
                .build();
    }

    /** Convert from DTO to entity */
    public AlertEvent toEntity() {
        return AlertEvent.builder()
                .alertId(this.alertId)
                .title(this.title)
                .severity(this.severity)
                .status(this.status != null ? this.status : AlertEvent.AlertStatus.NEW)
                .sourceIp(this.sourceIp)
                .destinationIp(this.destinationIp)
                .attackType(this.attackType)
                .description(this.description)
                .assignedAnalyst(this.assignedAnalyst)
                .detectedAt(this.detectedAt != null ? this.detectedAt : LocalDateTime.now())
                .build();
    }
}
