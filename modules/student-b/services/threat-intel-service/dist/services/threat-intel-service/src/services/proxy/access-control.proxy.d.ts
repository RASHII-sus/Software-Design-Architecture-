import { ConfigService } from '@nestjs/config';
import { ThreatIntelProvider } from '../adapter/threat-intel-provider.interface';
import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';
export interface AccessControlContext {
    apiKey: string;
    requesterId?: string;
    roles?: string[];
}
export declare class AccessControlProxy implements ThreatIntelProvider {
    private readonly realProvider;
    private readonly config;
    private readonly logger;
    private readonly internalApiKey;
    constructor(realProvider: ThreatIntelProvider, config: ConfigService);
    getProviderName(): string;
    supports(type: IndicatorType): boolean;
    checkReputation(indicator: string, type: IndicatorType, context?: AccessControlContext): Promise<ReputationResult>;
    private validateAccess;
}
