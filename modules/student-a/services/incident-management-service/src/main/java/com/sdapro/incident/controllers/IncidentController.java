package com.sdapro.incident.controllers;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.incident.services.IncidentLifecycleService;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.Severity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for incident lifecycle management.
 * Exposes endpoints for creating incidents and triggering state transitions.
 */
@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentLifecycleService lifecycleService;

    public IncidentController(IncidentLifecycleService lifecycleService) {
        this.lifecycleService = lifecycleService;
    }

    /** POST / — Create a new incident. */
    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody CreateIncidentRequest request) {
        Severity severity = Severity.valueOf(request.severity.toUpperCase());
        Incident incident = lifecycleService.createIncident(
            request.title, request.description, severity, request.alertIds
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(incident);
    }

    /** GET / — List all incidents (optional state filter). */
    @GetMapping
    public ResponseEntity<List<Incident>> getIncidents(
            @RequestParam(required = false) String state) {
        if (state != null) {
            IncidentStateType stateType = IncidentStateType.valueOf(state.toUpperCase());
            return ResponseEntity.ok(lifecycleService.getIncidentsByState(stateType));
        }
        return ResponseEntity.ok(lifecycleService.getAllIncidents());
    }

    /** GET /{id} — Get incident by ID. */
    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncident(@PathVariable UUID id) {
        return ResponseEntity.ok(lifecycleService.getIncident(id));
    }

    /** PUT /{id}/triage — Begin triage. */
    @PutMapping("/{id}/triage")
    public ResponseEntity<?> beginTriage(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        try {
            UUID analystId = UUID.fromString(body.getOrDefault("analystId", UUID.randomUUID().toString()));
            Incident incident = lifecycleService.triggerTriage(id, analystId);
            return ResponseEntity.ok(transitionResponse(incident, "Triage initiated"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /{id}/contain — Initiate containment. */
    @PutMapping("/{id}/contain")
    public ResponseEntity<?> initiateContainment(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> actions = (List<String>) body.getOrDefault("actions", List.of("ISOLATE_ENDPOINT"));
            Incident incident = lifecycleService.triggerContainment(id, actions);
            return ResponseEntity.ok(transitionResponse(incident, "Containment initiated"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /{id}/eradicate — Begin eradication. */
    @PutMapping("/{id}/eradicate")
    public ResponseEntity<?> beginEradication(@PathVariable UUID id) {
        try {
            Incident incident = lifecycleService.triggerEradication(id);
            return ResponseEntity.ok(transitionResponse(incident, "Eradication initiated"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /{id}/recover — Begin recovery. */
    @PutMapping("/{id}/recover")
    public ResponseEntity<?> beginRecovery(@PathVariable UUID id) {
        try {
            Incident incident = lifecycleService.triggerRecovery(id);
            return ResponseEntity.ok(transitionResponse(incident, "Recovery initiated"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /{id}/review — Start post-incident review. */
    @PutMapping("/{id}/review")
    public ResponseEntity<?> startPostReview(@PathVariable UUID id) {
        try {
            Incident incident = lifecycleService.triggerPostReview(id);
            return ResponseEntity.ok(transitionResponse(incident, "Post-incident review started"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /{id}/close — Close incident. */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeIncident(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        try {
            String summary = body.getOrDefault("summary", "Incident closed.");
            Incident incident = lifecycleService.triggerClose(id, summary);
            return ResponseEntity.ok(transitionResponse(incident, "Incident closed"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /{id}/escalate — Escalate incident. */
    @PostMapping("/{id}/escalate")
    public ResponseEntity<?> escalate(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        try {
            String reason = body.getOrDefault("reason", "Manual escalation");
            Incident incident = lifecycleService.triggerEscalation(id, reason);
            return ResponseEntity.ok(transitionResponse(incident, "Incident escalated"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /{id}/allowed-actions — Get current allowed response actions. */
    @GetMapping("/{id}/allowed-actions")
    public ResponseEntity<?> getAllowedActions(@PathVariable UUID id) {
        Incident incident = lifecycleService.getIncident(id);
        return ResponseEntity.ok(Map.of(
            "incidentId", id, "currentState", incident.getCurrentStateType(),
            "allowedActions", incident.getAllowedActions()
        ));
    }

    /** GET /{id}/allowed-transitions — Get current allowed state transitions. */
    @GetMapping("/{id}/allowed-transitions")
    public ResponseEntity<?> getAllowedTransitions(@PathVariable UUID id) {
        Incident incident = lifecycleService.getIncident(id);
        return ResponseEntity.ok(Map.of(
            "incidentId", id, "currentState", incident.getCurrentStateType(),
            "allowedTransitions", incident.getAllowedTransitions()
        ));
    }

    // --- DTOs ---

    private Map<String, Object> transitionResponse(Incident incident, String message) {
        return Map.of(
            "incidentId", incident.getId(),
            "currentState", incident.getCurrentStateType().name(),
            "message", message,
            "allowedTransitions", incident.getAllowedTransitions(),
            "allowedActions", incident.getAllowedActions()
        );
    }

    public static class CreateIncidentRequest {
        public String title;
        public String description;
        public String severity;
        public List<UUID> alertIds;
    }
}
