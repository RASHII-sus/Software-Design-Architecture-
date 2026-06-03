// services/threat-intel-service/src/services/threat-intel.service.ts
// Main service that orchestrates provider selection, persistence, and events.

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ThreatIntelProvider, THREAT_INTEL_PROVIDER } from './adapter/threat-intel-provider.interface';
import { VirusTotalAdapter } from './adapter/virustotal.adapter';
import { MISPAdapter } from './adapter/misp.adapter';
import { CustomFeedAdapter } from './adapter/custom-feed.adapter';
import { ThreatIntelCacheService } from './threat-intel-cache.service';
import { ThreatIndicatorRepository } from '../domain/repositories/threat-indicator.repository';
import { ThreatIntelEventPublisher } from '../events/threat-intel-event.publisher';
import {
  IndicatorType,
  ThreatIntelSource,
  Verdict,
} from '../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../shared/contracts/interfaces';
import { CheckReputationDto } from '../dto/check-reputation.dto';
import { BulkCheckReputationDto } from '../dto/bulk-check-reputation.dto';

@Injectable()
export class ThreatIntelService {
  private readonly logger = new Logger(ThreatIntelService.name);

  // Provider registry — maps source name to adapter instance
  private readonly providerRegistry: Map<ThreatIntelSource, ThreatIntelProvider>;

  constructor(
    // Primary proxy-wrapped provider (default: VirusTotal through full proxy stack)
    @Inject(THREAT_INTEL_PROVIDER)
    private readonly defaultProvider: ThreatIntelProvider,

    // Individual adapters for direct source routing
    private readonly virusTotalAdapter: VirusTotalAdapter,
    private readonly mispAdapter: MISPAdapter,
    private readonly customFeedAdapter: CustomFeedAdapter,

    private readonly cacheService: ThreatIntelCacheService,
    private readonly indicatorRepository: ThreatIndicatorRepository,
    private readonly eventPublisher: ThreatIntelEventPublisher,
  ) {
    this.providerRegistry = new Map<ThreatIntelSource, ThreatIntelProvider>([
      [ThreatIntelSource.VIRUSTOTAL, virusTotalAdapter],
      [ThreatIntelSource.MISP, mispAdapter],
      [ThreatIntelSource.CUSTOM_FEED, customFeedAdapter],
    ]);
  }

  async checkReputation(dto: CheckReputationDto): Promise<ReputationResult> {
    this.logger.log(
      `[ThreatIntelService] Checking reputation: ${dto.indicatorType}:${dto.indicator}` +
        (dto.source ? ` via ${dto.source}` : ' via default provider'),
    );

    const provider = dto.source
      ? this.resolveProviderBySource(dto.source)
      : this.defaultProvider;

    const result = await provider.checkReputation(dto.indicator, dto.indicatorType);

    // Persist to PostgreSQL
    await this.persistResult(result);

    // Publish ThreatIntelUpdated event to RabbitMQ if verdict is actionable
    if (result.verdict === Verdict.MALICIOUS || result.verdict === Verdict.SUSPICIOUS) {
      await this.eventPublisher.publishThreatIntelUpdated(result);
    }

    return result;
  }

  async bulkCheckReputation(dto: BulkCheckReputationDto): Promise<ReputationResult[]> {
    this.logger.log(
      `[ThreatIntelService] Bulk reputation check for ${dto.indicators.length} indicators`,
    );

    const results = await Promise.allSettled(
      dto.indicators.map((ind) =>
        this.checkReputation({
          indicator: ind.indicator,
          indicatorType: ind.indicatorType,
          source: dto.source,
        }),
      ),
    );

    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      this.logger.error(
        `[ThreatIntelService] Bulk check failed for ${dto.indicators[i].indicator}: ${r.reason}`,
      );
      // Return UNKNOWN on individual failure — don't fail the whole batch
      return {
        indicator: dto.indicators[i].indicator,
        indicatorType: dto.indicators[i].indicatorType,
        verdict: Verdict.UNKNOWN,
        reputationScore: 0,
        confidenceScore: 0,
        source: ThreatIntelSource.VIRUSTOTAL,
        tags: [],
        cachedAt: new Date().toISOString(),
      };
    });
  }

  async getIndicatorHistory(
    indicator: string,
    source?: ThreatIntelSource,
  ) {
    return this.indicatorRepository.findByIndicator(indicator, source);
  }

  async getMaliciousIndicators(limit = 50) {
    return this.indicatorRepository.findMaliciousIndicators(limit);
  }

  async getStats() {
    const [verdictCounts, cacheStats] = await Promise.all([
      this.indicatorRepository.countByVerdict(),
      this.cacheService.getCacheStats(),
    ]);
    return { verdictCounts, cacheStats };
  }

  async invalidateCache(indicator: string, type: IndicatorType): Promise<void> {
    await this.cacheService.invalidate(indicator, type);
    this.logger.log(`[ThreatIntelService] Cache invalidated for ${indicator}`);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────
  private resolveProviderBySource(source: ThreatIntelSource): ThreatIntelProvider {
    const provider = this.providerRegistry.get(source);
    if (!provider) {
      throw new Error(`No provider registered for source: ${source}`);
    }
    return provider;
  }

  private async persistResult(result: ReputationResult): Promise<void> {
    try {
      await this.indicatorRepository.upsert({
        indicator: result.indicator,
        indicatorType: result.indicatorType,
        verdict: result.verdict,
        confidenceScore: result.confidenceScore,
        reputationScore: result.reputationScore,
        source: result.source,
        rawResponse: result.rawData,
        tags: result.tags,
        expiresAt: result.expiresAt ? new Date(result.expiresAt) : undefined,
      });
    } catch (err) {
      // Log but don't throw — persistence failure shouldn't block the response
      this.logger.error(
        `[ThreatIntelService] Failed to persist result for ${result.indicator}: ${(err as Error).message}`,
      );
    }
  }
}
