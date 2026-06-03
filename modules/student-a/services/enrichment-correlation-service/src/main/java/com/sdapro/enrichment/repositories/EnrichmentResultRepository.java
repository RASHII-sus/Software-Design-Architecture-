package com.sdapro.enrichment.repositories;

import com.sdapro.enrichment.domain.EnrichmentResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrichmentResultRepository extends JpaRepository<EnrichmentResultEntity, UUID> {

    Optional<EnrichmentResultEntity> findByAlertId(UUID alertId);
}
