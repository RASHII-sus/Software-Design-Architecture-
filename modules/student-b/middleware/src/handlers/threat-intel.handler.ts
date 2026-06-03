// middleware/src/handlers/threat-intel.handler.ts
// PATTERN: Chain of Responsibility (Handler 3: Threat Intel Enrichment)
// Queries the threat-intel-service (which itself uses Proxy + Adapter pattern)
// to enrich the alert with reputation data for IPs, domains, and file hashes.

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import {
  CanonicalAlert,
  ThreatIntelContext,
  ReputationResult,
} from '../../../shared/contracts/interfaces';
import { IndicatorType, Verdict } from '../../../shared/contracts/enums';

@Injectable()
export class ThreatIntelHandler extends EnrichmentHandler {
  private readonly threatIntelServiceUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    super();
    this.threatIntelServiceUrl = this.config.get<string>(
      'app.threatIntelServiceUrl',
      'http://localhost:3002',
    );
    this.apiKey = this.config.get<string>('app.apiKeySecret', 'dev-secret');
  }

  getHandlerName(): string {
    return 'ThreatIntelHandler';
  }

  // PATTERN: Chain of Responsibility — H3 logic
  protected async doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult> {
    const { sourceIp, domain, fileHash } = alert.normalizedData;
    const indicator = sourceIp ?? domain ?? fileHash;

    if (!indicator) {
      this.logger.debug(
        `[ThreatIntelHandler] No checkable indicator in alert ${alert.id} — passing through`,
      );
      return {
        alert,
        enriched: false,
        handlerName: this.getHandlerName(),
        skipped: true,
        skipReason: 'NO_INDICATOR',
        durationMs: 0,
      };
    }

    const indicatorType = this.resolveIndicatorType(alert.normalizedData);

    try {
      const reputationResult = await this.queryThreatIntelService(indicator, indicatorType);

      const threatIntelContext: ThreatIntelContext = {
        indicator,
        indicatorType,
        verdict: reputationResult.verdict,
        reputationScore: reputationResult.reputationScore,
        confidenceScore: reputationResult.confidenceScore,
        sources: [reputationResult.source],
        tags: reputationResult.tags,
      };

      const enrichedAlert: CanonicalAlert = {
        ...alert,
        enrichmentContext: {
          ...alert.enrichmentContext,
          threatIntel: threatIntelContext,
        },
      };

      this.logger.log(
        `[ThreatIntelHandler] Alert ${alert.id} — ${indicatorType}:${indicator} ` +
          `verdict=${reputationResult.verdict} score=${reputationResult.reputationScore}`,
      );

      return {
        alert: enrichedAlert,
        enriched: true,
        handlerName: this.getHandlerName(),
        skipped: false,
        durationMs: 0,
        metadata: {
          indicator,
          indicatorType,
          verdict: reputationResult.verdict,
          reputationScore: reputationResult.reputationScore,
          isMalicious: reputationResult.verdict === Verdict.MALICIOUS,
        },
      };
    } catch (err) {
      // Non-fatal — log and continue the chain without threat intel context
      this.logger.warn(
        `[ThreatIntelHandler] Threat intel lookup failed for ${indicator}: ` +
          `${(err as Error).message}. Continuing pipeline without threat context.`,
      );
      return {
        alert,
        enriched: false,
        handlerName: this.getHandlerName(),
        skipped: true,
        skipReason: 'LOOKUP_FAILED',
        durationMs: 0,
        metadata: { error: (err as Error).message },
      };
    }
  }

  private async queryThreatIntelService(
    indicator: string,
    indicatorType: IndicatorType,
  ): Promise<ReputationResult> {
    const response = await firstValueFrom(
      this.httpService.post<ReputationResult>(
        `${this.threatIntelServiceUrl}/api/v1/threat-intel/reputation`,
        { indicator, indicatorType },
        {
          headers: { 'x-api-key': this.apiKey },
          timeout: 5000,
        },
      ),
    );
    return response.data;
  }

  private resolveIndicatorType(normalizedData: CanonicalAlert['normalizedData']): IndicatorType {
    if (normalizedData.fileHash) return IndicatorType.FILE_HASH;
    if (normalizedData.domain) return IndicatorType.DOMAIN;
    if (normalizedData.url) return IndicatorType.URL;
    return IndicatorType.IP;
  }
}
