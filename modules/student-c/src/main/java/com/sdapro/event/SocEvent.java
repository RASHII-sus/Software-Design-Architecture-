package com.sdapro.event;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * SocEvent - the message envelope for all events on the SOC Event Bus.
 * Serialized and sent over RabbitMQ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocEvent implements Serializable {

    private EventBus.EventType eventType;
    private String alertId;
    private String severity;
    private Map<String, Object> payload;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @Builder.Default
    private String source = "sda-pro-studentc";
}
