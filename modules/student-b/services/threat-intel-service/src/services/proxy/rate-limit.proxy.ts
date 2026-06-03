// services/threat-intel-service/src/services/proxy/rate-limit.proxy.ts
// PATTERN: Proxy (Rate Limiting Proxy)
// Enforces per-provider API rate limits using a Redis sliding window counter.
// Throws TooManyRequestsException when the limit is exceeded, protecting
// external API quotas (e.g. VirusTotal free tier: 4 req/min).

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThreatIntelProvider } from '../adapter/threat-intel-provider.interface';
import {
  IndicatorType,
  ThreatIntelSource,
} from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';

export class RateLimitExceededException extends Error {
  constructor(public readonly provider: string, public readonly limitPerMinute: number) {
    super(
      `Rate limit exceeded for provider ${provider}: ${limitPerMinute} req/min. Retry after 60s.`,
    );
    this.name = 'RateLimitExceededException';
  }
}

// Simple in-process sliding window (production would use Redis INCR + EXPIRE)
interface SlidingWindowEntry {
  timestamps: number[];
  limitPerMinute: number;
}

// PATTERN: Proxy — implements same interface, intercepts to enforce rate limits
export class RateLimitProxy implements ThreatIntelProvider {
  private readonly logger = new Logger(RateLimitProxy.name);
  private readonly windowMs = 60_000; // 1 minute
  private readonly windows: Map<string, SlidingWindowEntry> = new Map();
  private readonly limitPerMinute: number;

  constructor(
    private readonly realProvider: ThreatIntelProvider,
    private readonly config: ConfigService,
  ) {
    // Resolve rate limit for the underlying provider type
    this.limitPerMinute = this.resolveRateLimit(realProvider.getProviderName());
  }

  getProviderName(): string {
    return `RateLimitProxy(${this.realProvider.getProviderName()})`;
  }

  supports(type: IndicatorType): boolean {
    return this.realProvider.supports(type);
  }

  // PATTERN: Proxy — intercepts to enforce rate limit before delegating
  async checkReputation(
    indicator: string,
    type: IndicatorType,
  ): Promise<ReputationResult> {
    const providerKey = this.realProvider.getProviderName();

    if (!this.allowRequest(providerKey)) {
      const remaining = this.getRemainingRequests(providerKey);
      this.logger.warn(
        `[RateLimitProxy] Rate limit reached for ${providerKey}. ` +
          `Limit: ${this.limitPerMinute}/min. Remaining: ${remaining}`,
      );
      throw new RateLimitExceededException(providerKey, this.limitPerMinute);
    }

    this.logger.debug(
      `[RateLimitProxy] Request allowed for ${providerKey}. ` +
        `Remaining: ${this.getRemainingRequests(providerKey)}/${this.limitPerMinute}`,
    );

    return this.realProvider.checkReputation(indicator, type);
  }

  // ─── Sliding window logic ────────────────────────────────────────────────────
  private allowRequest(providerKey: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.windows.has(providerKey)) {
      this.windows.set(providerKey, {
        timestamps: [now],
        limitPerMinute: this.limitPerMinute,
      });
      return true;
    }

    const entry = this.windows.get(providerKey)!;
    // Evict timestamps outside the sliding window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= this.limitPerMinute) {
      return false;
    }

    entry.timestamps.push(now);
    return true;
  }

  private getRemainingRequests(providerKey: string): number {
    const entry = this.windows.get(providerKey);
    if (!entry) return this.limitPerMinute;
    const now = Date.now();
    const active = entry.timestamps.filter((ts) => ts > now - this.windowMs).length;
    return Math.max(0, this.limitPerMinute - active);
  }

  private resolveRateLimit(providerName: string): number {
    const upper = providerName.toUpperCase();
    if (upper.includes(ThreatIntelSource.VIRUSTOTAL)) {
      return this.config.get<number>('externalApis.virusTotal.rateLimitPerMinute', 4);
    }
    if (upper.includes(ThreatIntelSource.MISP)) {
      return this.config.get<number>('externalApis.misp.rateLimitPerMinute', 60);
    }
    if (upper.includes(ThreatIntelSource.CUSTOM_FEED)) {
      return this.config.get<number>('externalApis.customFeed.rateLimitPerMinute', 30);
    }
    return 10; // conservative default
  }
}
