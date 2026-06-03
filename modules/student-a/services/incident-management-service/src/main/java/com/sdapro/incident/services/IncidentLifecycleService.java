package com.sdapro.incident.services;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.incident.repositories.IncidentRepository;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.Severity;
import com.sdapro.shared.events.IncidentCreatedEvent;
import com.sdapro.shared.events.IncidentStateChangedEvent;
import com.sdapro.shared.events.SimpleEventBus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Service managing the incident lifecycle and state transitions.
 * Coordinates state changes, persistence, and event publishing.
 */
@Service
public class IncidentLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(IncidentLifecycleService.class);
    private final IncidentRepository repository;

    public IncidentLifecycleService(IncidentRepository repository) {
        this.repository = repository;
    }

    /** Create a new incident in the NEW state. */
    public Incident createIncident(String title, String description, Severity severity, List<UUID> alertIds) {
        Incident incident = new Incident(title, description, severity, alertIds);
        repository.save(incident);

        log.info("Created incident: id={}, severity={}", incident.getId(), severity);

        SimpleEventBus.getInstance().publish(
            new IncidentCreatedEvent(incident.getId(), severity,
                                     alertIds != null ? alertIds.size() : 0, title)
        );

        return incident;
    }

    /** Transition: begin triage. */
    public Incident triggerTriage(UUID incidentId, UUID analystId) {
        return executeTransition(incidentId, "beginTriage", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.beginTriage(analystId);
            publishStateChange(incident, prev, "analyst:" + analystId);
        });
    }

    /** Transition: initiate containment. */
    public Incident triggerContainment(UUID incidentId, List<String> actions) {
        return executeTransition(incidentId, "initiateContainment", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.initiateContainment(actions);
            publishStateChange(incident, prev, "containment-actions");
        });
    }

    /** Transition: begin eradication. */
    public Incident triggerEradication(UUID incidentId) {
        return executeTransition(incidentId, "beginEradication", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.beginEradication();
            publishStateChange(incident, prev, "system");
        });
    }

    /** Transition: begin recovery. */
    public Incident triggerRecovery(UUID incidentId) {
        return executeTransition(incidentId, "beginRecovery", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.beginRecovery();
            publishStateChange(incident, prev, "system");
        });
    }

    /** Transition: start post-incident review. */
    public Incident triggerPostReview(UUID incidentId) {
        return executeTransition(incidentId, "startPostIncidentReview", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.startPostIncidentReview();
            publishStateChange(incident, prev, "system");
        });
    }

    /** Transition: close incident. */
    public Incident triggerClose(UUID incidentId, String summary) {
        return executeTransition(incidentId, "close", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.close(summary);
            publishStateChange(incident, prev, "closure");
        });
    }

    /** Escalate incident. */
    public Incident triggerEscalation(UUID incidentId, String reason) {
        return executeTransition(incidentId, "escalate", incident -> {
            IncidentStateType prev = incident.getCurrentStateType();
            incident.escalate(reason);
            publishStateChange(incident, prev, "escalation:" + reason);
        });
    }

    /** Get incident by ID. */
    public Incident getIncident(UUID id) {
        return repository.findById(id).orElseThrow(() ->
            new IllegalArgumentException("Incident not found: " + id));
    }

    /** List all incidents. */
    public List<Incident> getAllIncidents() { return repository.findAll(); }

    /** List incidents by state. */
    public List<Incident> getIncidentsByState(IncidentStateType state) {
        return repository.findByCurrentStateType(state);
    }

    // --- Internal helpers ---

    private Incident executeTransition(UUID incidentId, String action,
                                        java.util.function.Consumer<Incident> transition) {
        Incident incident = getIncident(incidentId);
        log.info("Executing '{}' on incident {} (current state: {})",
                 action, incidentId, incident.getCurrentStateType());

        transition.accept(incident);
        repository.save(incident);

        log.info("Transition complete: incident {} now in state {}",
                 incidentId, incident.getCurrentStateType());
        return incident;
    }

    private void publishStateChange(Incident incident, IncidentStateType previousState, String triggeredBy) {
        SimpleEventBus.getInstance().publish(
            new IncidentStateChangedEvent(
                incident.getId(), previousState, incident.getCurrentStateType(),
                triggeredBy, "State transition: " + previousState + " → " + incident.getCurrentStateType()
            )
        );
    }
}
