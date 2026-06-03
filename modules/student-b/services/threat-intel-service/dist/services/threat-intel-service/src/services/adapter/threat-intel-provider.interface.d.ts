import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';
export interface ThreatIntelProvider {
    checkReputation(indicator: string, type: IndicatorType): Promise<ReputationResult>;
    getProviderName(): string;
    supports(type: IndicatorType): boolean;
}
export declare const THREAT_INTEL_PROVIDER = "THREAT_INTEL_PROVIDER";
