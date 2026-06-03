// services/threat-intel-service/src/services/adapter/misp.adapter.ts
// PATTERN: Adapter
// Wraps the MISP (Malware Information Sharing Platform) REST API.
// MISP uses a completely different schema (STIX-inspired) — this adapter
// translates it into SDA-Pro's canonical ReputationResult.

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

// ─── MISP API response shapes ─────────────────────────────────────────────────
interface MISPAttribute {
  id: string;
  event_id: string;
  category: string;
  type: string;        // e.g. 'ip-src', 'domain', 'md5', 'sha256'
  value: string;
  to_ids: boolean;     // flagged as indicator of compromise
  timestamp: string;
  comment?: string;
  tags?: MISPTag[];
  Event?: {
    id: string;
    info: string;
    threat_level_id: string; // '1'=High, '2'=Medium, '3'=Low, '4'=Undefined
    analysis: string;        // '0'=Initial,'1'=Ongoing,'2'=Completed
  };
}

interface MISPTag {
  id: string;
  name: string;
  colour: string;
  is_galaxy: boolean;
}

interface MISPSearchResponse {
  response: {
    Attribute: MISPAttribute[];
  };
}

// ─── Adapter Implementation ───────────────────────────────────────────────────
@Injectable()
export class MISPAdapter implements ThreatIntelProvider {
  private readonly logger = new Logger(MISPAdapter.name);
  private readonly baseUrl: string;
  private readonly authKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('externalApis.misp.baseUrl')!;
    this.authKey = this.config.get<string>('externalApis.misp.authKey')!;
  }

  getProviderName(): string {
    return ThreatIntelSource.MISP;
  }

  supports(type: IndicatorType): boolean {
    return [
      IndicatorType.IP,
      IndicatorType.DOMAIN,
      IndicatorType.FILE_HASH,
      IndicatorType.URL,
      IndicatorType.EMAIL,
    ].includes(type);
  }

  // PATTERN: Adapter — translates MISP-specific format to canonical ReputationResult
  async checkReputation(
    indicator: string,
    type: IndicatorType,
  ): Promise<ReputationResult> {
    this.logger.debug(`[MISPAdapter] Querying MISP for ${type}:${indicator}`);

    try {
      const mispTypes = this.mapIndicatorTypeToMISP(type);
      const response = await firstValueFrom(
        this.httpService.post<MISPSearchResponse>(
          `${this.baseUrl}/attributes/restSearch`,
          {
            returnFormat: 'json',
            value: indicator,
            type: mispTypes,
            limit: 20,
            page: 1,
            includeEventTags: true,
          },
          {
            headers: {
              'Authorization': this.authKey,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        ),
      );

      return this.adaptResponse(indicator, type, response.data);
    } catch (err) {
      const axiosErr = err as AxiosError;
      this.logger.error(
        `[MISPAdapter] API error for ${indicator}: ${axiosErr.message}`,
      );
      throw err;
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  // PATTERN: Adapter — core MISP schema → canonical schema translation
  private adaptResponse(
    indicator: string,
    type: IndicatorType,
    mispResponse: MISPSearchResponse,
  ): ReputationResult {
    const attributes = mispResponse.response?.Attribute ?? [];

    if (attributes.length === 0) {
      return this.buildUnknownResult(indicator, type);
    }

    // Aggregate verdicts from all matching attributes
    let maxThreatLevel = 4; // undefined by default
    let iocCount = 0;
    const allTags: Set<string> = new Set();

    for (const attr of attributes) {
      if (attr.to_ids) {
        iocCount++;
      }
      const eventThreatLevel = parseInt(attr.Event?.threat_level_id ?? '4', 10);
      if (eventThreatLevel < maxThreatLevel) {
        maxThreatLevel = eventThreatLevel;
      }
      for (const tag of attr.tags ?? []) {
        if (!tag.is_galaxy) {
          allTags.add(tag.name);
        }
      }
    }

    const verdict = this.mapThreatLevelToVerdict(maxThreatLevel, iocCount, attributes.length);
    const reputationScore = this.calculateReputationScore(maxThreatLevel, iocCount, attributes.length);
    const confidenceScore = Math.min(attributes.length * 10, 100);

    const now = new Date();
    return {
      indicator,
      indicatorType: type,
      verdict,
      reputationScore,
      confidenceScore,
      source: ThreatIntelSource.MISP,
      tags: Array.from(allTags),
      rawData: mispResponse as unknown as Record<string, unknown>,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 3600 * 1000).toISOString(),
    };
  }

  private mapIndicatorTypeToMISP(type: IndicatorType): string[] {
    const mapping: Record<IndicatorType, string[]> = {
      [IndicatorType.IP]: ['ip-src', 'ip-dst', 'ip-src|port', 'ip-dst|port'],
      [IndicatorType.DOMAIN]: ['domain', 'hostname', 'domain|ip'],
      [IndicatorType.FILE_HASH]: ['md5', 'sha1', 'sha256', 'sha512', 'filename|md5', 'filename|sha256'],
      [IndicatorType.URL]: ['url', 'uri'],
      [IndicatorType.EMAIL]: ['email-src', 'email-dst', 'email-subject'],
    };
    return mapping[type] ?? [type.toLowerCase()];
  }

  private mapThreatLevelToVerdict(
    threatLevel: number,
    iocCount: number,
    totalMatches: number,
  ): Verdict {
    if (threatLevel === 1 || iocCount >= 3) return Verdict.MALICIOUS;
    if (threatLevel === 2 || iocCount >= 1) return Verdict.SUSPICIOUS;
    if (totalMatches > 0 && iocCount === 0) return Verdict.SUSPICIOUS;
    return Verdict.UNKNOWN;
  }

  private calculateReputationScore(
    threatLevel: number,
    iocCount: number,
    totalMatches: number,
  ): number {
    const levelScore = Math.max(0, (5 - threatLevel) * 20); // 1→80, 2→60, 3→40, 4→20
    const iocBonus = Math.min(iocCount * 10, 20);
    return Math.min(levelScore + iocBonus, 100);
  }

  private buildUnknownResult(indicator: string, type: IndicatorType): ReputationResult {
    const now = new Date();
    return {
      indicator,
      indicatorType: type,
      verdict: Verdict.UNKNOWN,
      reputationScore: 0,
      confidenceScore: 0,
      source: ThreatIntelSource.MISP,
      tags: [],
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 1800 * 1000).toISOString(),
    };
  }
}
