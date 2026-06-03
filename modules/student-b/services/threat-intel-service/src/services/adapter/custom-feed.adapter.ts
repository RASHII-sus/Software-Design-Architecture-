// services/threat-intel-service/src/services/adapter/custom-feed.adapter.ts
// PATTERN: Adapter
// Wraps a generic custom threat intelligence feed that exposes a simple
// JSON REST API. Adapts the custom schema to SDA-Pro's canonical interface.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ThreatIntelProvider } from './threat-intel-provider.interface';
import {
  IndicatorType,
  Verdict,
  ThreatIntelSource,
} from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';

// ─── Custom feed API response shapes ─────────────────────────────────────────
// The custom feed returns this proprietary schema — adapter translates it
interface CustomFeedIndicatorResponse {
  found: boolean;
  indicator: string;
  type: string;
  risk_score: number;         // 0-10 scale
  classification: string;     // 'malware', 'c2', 'phishing', 'spam', 'clean', 'unknown'
  confidence: number;         // 0-100
  last_updated: string;       // ISO timestamp
  categories: string[];
  sources: string[];
  ttl: number;                // seconds until data expires
}

// ─── Adapter Implementation ───────────────────────────────────────────────────
@Injectable()
export class CustomFeedAdapter implements ThreatIntelProvider {
  private readonly logger = new Logger(CustomFeedAdapter.name);
  private readonly feedUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.feedUrl = this.config.get<string>('externalApis.customFeed.url')!;
    this.apiKey = this.config.get<string>('externalApis.customFeed.apiKey')!;
  }

  getProviderName(): string {
    return ThreatIntelSource.CUSTOM_FEED;
  }

  supports(type: IndicatorType): boolean {
    return [
      IndicatorType.IP,
      IndicatorType.DOMAIN,
      IndicatorType.FILE_HASH,
    ].includes(type);
  }

  // PATTERN: Adapter — translates custom feed schema to canonical ReputationResult
  async checkReputation(
    indicator: string,
    type: IndicatorType,
  ): Promise<ReputationResult> {
    this.logger.debug(`[CustomFeedAdapter] Querying custom feed for ${type}:${indicator}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<CustomFeedIndicatorResponse>(
          `${this.feedUrl}/indicators/lookup`,
          {
            params: {
              value: indicator,
              type: type.toLowerCase(),
            },
            headers: {
              'X-API-Key': this.apiKey,
              'Accept': 'application/json',
            },
            timeout: 8000,
          },
        ),
      );

      return this.adaptResponse(indicator, type, response.data);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 404) {
        return this.buildUnknownResult(indicator, type, 1800);
      }
      this.logger.error(
        `[CustomFeedAdapter] API error for ${indicator}: ${axiosErr.message}`,
      );
      throw err;
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  // PATTERN: Adapter — custom schema → canonical schema translation
  private adaptResponse(
    indicator: string,
    type: IndicatorType,
    feedResponse: CustomFeedIndicatorResponse,
  ): ReputationResult {
    if (!feedResponse.found) {
      return this.buildUnknownResult(indicator, type, feedResponse.ttl ?? 1800);
    }

    const verdict = this.mapClassificationToVerdict(feedResponse.classification);
    // Normalize risk_score from 0-10 to 0-100
    const reputationScore = Math.round(feedResponse.risk_score * 10);
    const confidenceScore = feedResponse.confidence;

    const now = new Date();
    const ttlMs = (feedResponse.ttl ?? 3600) * 1000;

    return {
      indicator,
      indicatorType: type,
      verdict,
      reputationScore,
      confidenceScore,
      source: ThreatIntelSource.CUSTOM_FEED,
      tags: feedResponse.categories ?? [],
      rawData: feedResponse as unknown as Record<string, unknown>,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    };
  }

  private mapClassificationToVerdict(classification: string): Verdict {
    const lower = classification.toLowerCase();
    if (['malware', 'c2', 'ransomware', 'exploit', 'botnet'].includes(lower)) {
      return Verdict.MALICIOUS;
    }
    if (['phishing', 'spam', 'suspicious', 'adware'].includes(lower)) {
      return Verdict.SUSPICIOUS;
    }
    if (lower === 'clean') {
      return Verdict.CLEAN;
    }
    return Verdict.UNKNOWN;
  }

  private buildUnknownResult(
    indicator: string,
    type: IndicatorType,
    ttlSeconds: number,
  ): ReputationResult {
    const now = new Date();
    return {
      indicator,
      indicatorType: type,
      verdict: Verdict.UNKNOWN,
      reputationScore: 0,
      confidenceScore: 0,
      source: ThreatIntelSource.CUSTOM_FEED,
      tags: [],
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
    };
  }
}
