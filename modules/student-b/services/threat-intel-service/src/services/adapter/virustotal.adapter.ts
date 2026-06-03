// services/threat-intel-service/src/services/adapter/virustotal.adapter.ts
// PATTERN: Adapter
// Wraps the VirusTotal v3 API and adapts its proprietary response format
// into SDA-Pro's canonical ReputationResult interface.

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

// ─── VirusTotal API response shapes ─────────────────────────────────────────
interface VTAnalysisStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
}

interface VTFileAttributes {
  last_analysis_stats: VTAnalysisStats;
  meaningful_name?: string;
  md5?: string;
  sha1?: string;
  sha256?: string;
  tags?: string[];
  reputation?: number;
}

interface VTIPAttributes {
  last_analysis_stats: VTAnalysisStats;
  country?: string;
  as_owner?: string;
  tags?: string[];
  reputation?: number;
}

interface VTDomainAttributes {
  last_analysis_stats: VTAnalysisStats;
  tags?: string[];
  reputation?: number;
  registrar?: string;
}

interface VTResponse {
  data: {
    id: string;
    type: string;
    attributes: VTFileAttributes | VTIPAttributes | VTDomainAttributes;
  };
}

// ─── Adapter Implementation ───────────────────────────────────────────────────
@Injectable()
export class VirusTotalAdapter implements ThreatIntelProvider {
  private readonly logger = new Logger(VirusTotalAdapter.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('externalApis.virusTotal.baseUrl')!;
    this.apiKey = this.config.get<string>('externalApis.virusTotal.apiKey')!;
  }

  getProviderName(): string {
    return ThreatIntelSource.VIRUSTOTAL;
  }

  supports(type: IndicatorType): boolean {
    // VirusTotal supports all our indicator types
    return [
      IndicatorType.IP,
      IndicatorType.DOMAIN,
      IndicatorType.FILE_HASH,
      IndicatorType.URL,
    ].includes(type);
  }

  // PATTERN: Adapter — translates VT-specific format to canonical ReputationResult
  async checkReputation(
    indicator: string,
    type: IndicatorType,
  ): Promise<ReputationResult> {
    this.logger.debug(`[VirusTotalAdapter] Checking reputation for ${type}:${indicator}`);

    try {
      const endpoint = this.buildEndpoint(indicator, type);
      const response = await firstValueFrom(
        this.httpService.get<VTResponse>(endpoint, {
          headers: {
            'x-apikey': this.apiKey,
            'Accept': 'application/json',
          },
          timeout: 8000,
        }),
      );

      return this.adaptResponse(indicator, type, response.data);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 404) {
        // Indicator not found in VT — treat as UNKNOWN, not an error
        return this.buildUnknownResult(indicator, type);
      }
      this.logger.error(
        `[VirusTotalAdapter] API error for ${indicator}: ${axiosErr.message}`,
        axiosErr.stack,
      );
      throw err;
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────
  private buildEndpoint(indicator: string, type: IndicatorType): string {
    switch (type) {
      case IndicatorType.IP:
        return `${this.baseUrl}/ip_addresses/${encodeURIComponent(indicator)}`;
      case IndicatorType.DOMAIN:
        return `${this.baseUrl}/domains/${encodeURIComponent(indicator)}`;
      case IndicatorType.FILE_HASH:
        return `${this.baseUrl}/files/${encodeURIComponent(indicator)}`;
      case IndicatorType.URL: {
        // VT requires base64url-encoded URL for URL lookups
        const encoded = Buffer.from(indicator).toString('base64url');
        return `${this.baseUrl}/urls/${encoded}`;
      }
      default:
        throw new Error(`VirusTotalAdapter does not support indicator type: ${type}`);
    }
  }

  // PATTERN: Adapter — core translation logic from VT schema → canonical schema
  private adaptResponse(
    indicator: string,
    type: IndicatorType,
    vtResponse: VTResponse,
  ): ReputationResult {
    const attrs = vtResponse.data.attributes;
    const stats = attrs.last_analysis_stats;
    const totalEngines =
      stats.malicious + stats.suspicious + stats.undetected + stats.harmless + stats.timeout;
    const positives = stats.malicious + stats.suspicious;

    const verdict = this.calculateVerdict(stats);
    const reputationScore = totalEngines > 0
      ? Math.round((positives / totalEngines) * 100)
      : 0;
    const confidenceScore = totalEngines > 0
      ? Math.min(Math.round((totalEngines / 70) * 100), 100) // normalize to 70 engines max
      : 0;

    const rawTags = attrs.tags ?? [];

    const now = new Date();
    return {
      indicator,
      indicatorType: type,
      verdict,
      reputationScore,
      confidenceScore,
      source: ThreatIntelSource.VIRUSTOTAL,
      tags: rawTags,
      rawData: vtResponse as unknown as Record<string, unknown>,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 3600 * 1000).toISOString(),
    };
  }

  private calculateVerdict(stats: VTAnalysisStats): Verdict {
    if (stats.malicious >= 3) return Verdict.MALICIOUS;
    if (stats.malicious >= 1 || stats.suspicious >= 3) return Verdict.SUSPICIOUS;
    if (stats.harmless > 0 || stats.undetected > 0) return Verdict.CLEAN;
    return Verdict.UNKNOWN;
  }

  private buildUnknownResult(indicator: string, type: IndicatorType): ReputationResult {
    const now = new Date();
    return {
      indicator,
      indicatorType: type,
      verdict: Verdict.UNKNOWN,
      reputationScore: 0,
      confidenceScore: 0,
      source: ThreatIntelSource.VIRUSTOTAL,
      tags: [],
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 1800 * 1000).toISOString(),
    };
  }
}
