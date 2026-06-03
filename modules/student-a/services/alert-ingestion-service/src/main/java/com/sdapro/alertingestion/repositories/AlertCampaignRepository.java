package com.sdapro.alertingestion.repositories;

import com.sdapro.alertingestion.domain.alert.AlertCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AlertCampaignRepository extends JpaRepository<AlertCampaign, UUID> {
}
