// services/threat-intel-service/src/services/threat-intel-cache.service.ts
// Manages Redis-backed cache for threat intelligence results.
// Used internally by CachingProxy.

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.module';
import { IndicatorType } from '../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../shared/contracts/interfaces';

@Injectable()
export class ThreatIntelCacheService {
  private readonly logger = new Logger(ThreatIntelCacheService.name);
  private readonly defaultTtlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {
    this.defaultTtlSeconds = this.config.get<number>(
      'redis.cacheTtlSeconds',
      3600,
    );
  }

  buildCacheKey(indicator: string, type: IndicatorType, source?: string): string {
    const parts = ['sda', 'threat-intel', type.toLowerCase(), indicator];
    if (source) parts.push(source.toLowerCase());
    return parts.join(':');
  }

  async get(indicator: string, type: IndicatorType, source?: string): Promise<ReputationResult | null> {
    const key = this.buildCacheKey(indicator, type, source);
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ReputationResult;
      this.logger.debug(`[ThreatIntelCacheService] Cache HIT for key: ${key}`);
      return parsed;
    } catch (err) {
      this.logger.warn(`[ThreatIntelCacheService] Cache GET error for ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  async set(
    result: ReputationResult,
    ttlSeconds?: number,
  ): Promise<void> {
    const key = this.buildCacheKey(result.indicator, result.indicatorType, result.source);
    const ttl = ttlSeconds ?? this.resolveTtlFromResult(result);
    try {
      await this.redis.set(key, JSON.stringify(result), 'EX', ttl);
      this.logger.debug(`[ThreatIntelCacheService] Cached ${result.indicator} for ${ttl}s`);
    } catch (err) {
      this.logger.warn(`[ThreatIntelCacheService] Cache SET error for ${key}: ${(err as Error).message}`);
    }
  }

  async invalidate(indicator: string, type: IndicatorType): Promise<void> {
    // Delete all provider-specific keys for this indicator
    const pattern = this.buildCacheKey(indicator, type) + ':*';
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`[ThreatIntelCacheService] Invalidated ${keys.length} keys for ${indicator}`);
      }
      // Also delete the non-source-specific key
      await this.redis.del(this.buildCacheKey(indicator, type));
    } catch (err) {
      this.logger.warn(`[ThreatIntelCacheService] Invalidation error: ${(err as Error).message}`);
    }
  }

  async getCacheStats(): Promise<{ size: number; memoryUsage: string }> {
    try {
      const keys = await this.redis.keys('sda:threat-intel:*');
      const info = await this.redis.info('memory');
      const memMatch = info.match(/used_memory_human:(.+)/);
      return {
        size: keys.length,
        memoryUsage: memMatch ? memMatch[1].trim() : 'unknown',
      };
    } catch {
      return { size: 0, memoryUsage: 'unknown' };
    }
  }

  private resolveTtlFromResult(result: ReputationResult): number {
    if (result.expiresAt) {
      const expiresMs = new Date(result.expiresAt).getTime() - Date.now();
      return Math.max(Math.floor(expiresMs / 1000), 60);
    }
    return this.defaultTtlSeconds;
  }
}
