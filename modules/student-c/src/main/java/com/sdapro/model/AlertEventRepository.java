package com.sdapro.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertEventRepository extends JpaRepository<AlertEvent, Long> {

    List<AlertEvent> findByStatus(AlertEvent.AlertStatus status);

    List<AlertEvent> findBySeverity(AlertEvent.Severity severity);

    List<AlertEvent> findByAssignedAnalyst(String analyst);

    List<AlertEvent> findByDetectedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT a FROM AlertEvent a WHERE a.severity IN ('HIGH','CRITICAL') AND a.status != 'CLOSED'")
    List<AlertEvent> findOpenCriticalAndHigh();

    @Query("SELECT COUNT(a) FROM AlertEvent a WHERE a.status = :status")
    long countByStatus(AlertEvent.AlertStatus status);

    @Query("SELECT COUNT(a) FROM AlertEvent a WHERE a.severity = :severity AND a.status != 'CLOSED'")
    long countOpenBySeverity(AlertEvent.Severity severity);

    @Query("SELECT a.severity, COUNT(a) FROM AlertEvent a GROUP BY a.severity")
    List<Object[]> countGroupedBySeverity();

    @Query("SELECT a FROM AlertEvent a WHERE a.status NOT IN ('CLOSED') ORDER BY a.severity DESC, a.detectedAt ASC")
    List<AlertEvent> findAllOpenSortedByPriority();
}
