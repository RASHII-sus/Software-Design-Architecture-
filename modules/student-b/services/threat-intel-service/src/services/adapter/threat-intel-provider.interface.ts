// services/threat-intel-service/src/services/adapter/threat-intel-provider.interface.ts
// PATTERN: Adapter — defines the target interface all adapters must conform to

import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';

export interface ThreatIntelProvider {
  /**
   * Check the reputation of an indicator (IP, domain, file hash, URL).
   * Each concrete adapter translates the external API response into
   * this canonical ReputationResult shape.
   */
  checkReputation(indicator: string, type: IndicatorType): Promise<ReputationResult>;

  /**
   * Returns the name of this provider — used for logging and routing.
   */
  getProviderName(): string;

  /**
   * Returns true if this provider supports the given indicator type.
   */
  supports(type: IndicatorType): boolean;
}

export const THREAT_INTEL_PROVIDER = 'THREAT_INTEL_PROVIDER';
