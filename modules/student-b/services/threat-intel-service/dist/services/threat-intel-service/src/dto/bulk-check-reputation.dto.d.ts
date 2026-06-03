import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';
export declare class IndicatorItem {
    indicator: string;
    indicatorType: IndicatorType;
}
export declare class BulkCheckReputationDto {
    indicators: IndicatorItem[];
    source?: ThreatIntelSource;
}
