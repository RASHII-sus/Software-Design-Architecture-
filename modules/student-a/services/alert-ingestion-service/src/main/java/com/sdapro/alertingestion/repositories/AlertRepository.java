package com.sdapro.alertingestion.repositories;

import com.sdapro.alertingestion.domain.alert.SingleAlert;
import com.sdapro.shared.commons.AlertSourceType;
import com.sdapro.shared.commons.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<SingleAlert, UUID> {

    List<SingleAlert> findBySeverity(Severity severity);

    List<SingleAlert> findBySourceType(AlertSourceType sourceType);

    List<SingleAlert> findByTimestampAfter(Instant timestamp);
}
