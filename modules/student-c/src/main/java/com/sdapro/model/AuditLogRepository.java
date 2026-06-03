package com.sdapro.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByPerformedByOrderByTimestampDesc(String user);

    List<AuditLog> findByTargetEntityId(String entityId);

    List<AuditLog> findByComplianceFlag(AuditLog.ComplianceFlag flag);

    List<AuditLog> findByTimestampBetween(LocalDateTime from, LocalDateTime to);

    List<AuditLog> findByEventTypeOrderByTimestampDesc(String eventType);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentLogs(LocalDateTime since);

    @Query("SELECT a.complianceFlag, COUNT(a) FROM AuditLog a GROUP BY a.complianceFlag")
    List<Object[]> countByComplianceFlag();
}
