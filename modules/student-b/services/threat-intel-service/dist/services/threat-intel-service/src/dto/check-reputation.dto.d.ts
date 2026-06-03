import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';
export declare class CheckReputationDto {
    indicator: string;
    indicatorType: IndicatorType;
    source?: ThreatIntelSource;
}
