import { Severity, IncidentState } from '../../../../shared/contracts/enums';
export declare class TargetAssetDto {
    assetId?: string;
    hostname?: string;
    ipAddress?: string;
    userId?: string;
    filePath?: string;
    fileHash?: string;
    domain?: string;
    metadata?: Record<string, unknown>;
}
export declare class AssessAndRespondDto {
    incidentId: string;
    severity: Severity;
    incidentState: IncidentState;
    assetCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    targetAssets: TargetAssetDto[];
    analystId?: string;
    autoResponse?: boolean;
    businessContext?: string;
}
