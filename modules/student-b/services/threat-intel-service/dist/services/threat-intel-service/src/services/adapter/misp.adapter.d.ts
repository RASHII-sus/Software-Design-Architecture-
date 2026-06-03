import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ThreatIntelProvider } from './threat-intel-provider.interface';
import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';
export declare class MISPAdapter implements ThreatIntelProvider {
    private readonly httpService;
    private readonly config;
    private readonly logger;
    private readonly baseUrl;
    private readonly authKey;
    constructor(httpService: HttpService, config: ConfigService);
    getProviderName(): string;
    supports(type: IndicatorType): boolean;
    checkReputation(indicator: string, type: IndicatorType): Promise<ReputationResult>;
    private adaptResponse;
    private mapIndicatorTypeToMISP;
    private mapThreatLevelToVerdict;
    private calculateReputationScore;
    private buildUnknownResult;
}
