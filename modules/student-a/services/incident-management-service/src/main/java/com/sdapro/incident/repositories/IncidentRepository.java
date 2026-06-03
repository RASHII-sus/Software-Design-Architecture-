package com.sdapro.incident.repositories;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    List<Incident> findByCurrentStateType(IncidentStateType stateType);

    List<Incident> findBySeverity(Severity severity);

    List<Incident> findByAssignedAnalystId(UUID analystId);
}
