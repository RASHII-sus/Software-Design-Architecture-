// services/threat-intel-service/src/services/proxy/caching.proxy.ts
// PATTERN: Proxy (Caching Proxy)
// Sits in front of any ThreatIntelProvider. Checks Redis before delegating
// to the real provider. Caches the result on miss. Transparent to callers.

import { Logger } from '@nestjs/common';
import { ThreatIntelProvider } from '../adapter/threat-intel-provider.interface';
import { ThreatIntelCacheService } from '../threat-intel-cache.service';
import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';

// PATTERN: Proxy — implements the same interface as the real provider
export class CachingProxy implements ThreatIntelProvider {
  private readonly logger = new Logger(CachingProxy.name);

  constructor(
    // The real provider this proxy delegates to on cache miss
    private readonly realProvider: ThreatIntelProvider,
    private readonly cacheService: ThreatIntelCacheService,
  ) {}

  getProviderName(): string {
    return `CachingProxy(${this.realProvider.getProviderName()})`;
  }

  supports(type: IndicatorType): boolean {
    return this.realProvider.supports(type);
  }

  // PATTERN: Proxy — intercepts the call, checks cache, delegates on miss
  async checkReputation(
    indicator: string,
    type: IndicatorType,
  ): Promise<ReputationResult> {
    const providerName = this.realProvider.getProviderName();

    // ① Check cache first
    const cached = await this.cacheService.get(indicator, type, providerName);
    if (cached) {
      this.logger.debug(
        `[CachingProxy] CACHE HIT — ${indicator} (${type}) from ${providerName}`,
      );
      return cached;
    }

    this.logger.debug(
      `[CachingProxy] CACHE MISS — delegating to ${providerName} for ${indicator}`,
    );

    // ② Delegate to the real provider
    const result = await this.realProvider.checkReputation(indicator, type);

    // ③ Store result in cache for future requests
    await this.cacheService.set(result);

    return result;
  }
}
