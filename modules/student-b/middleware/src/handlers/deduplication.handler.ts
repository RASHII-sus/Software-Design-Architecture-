// middleware/src/handlers/deduplication.handler.ts
// PATTERN: Chain of Responsibility (Handler 1: Deduplication)
// Checks whether this alert has been seen recently (within the configurable
// window). If it's a duplicate, stops the chain. Otherwise passes forward.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';

// In-memory deduplication cache. Production: use Redis SETNX + EXPIRE.
const deduplicationCache = new Map<string, number>();

@Injectable()
export class DeduplicationHandler extends EnrichmentHandler {
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    super();
    this.windowSeconds = this.config.get<number>('app.deduplicationWindowSeconds', 300);
  }

  getHandlerName(): string {
    return 'DeduplicationHandler';
  }

  // PATTERN: Chain of Responsibility — H1 logic
  protected async doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult> {
    const dedupKey = this.buildDedupKey(alert);
    const now = Date.now();
    const windowMs = this.windowSeconds * 1000;

    // Evict expired entries
    for (const [key, ts] of deduplicationCache.entries()) {
      if (now - ts > windowMs) {
        deduplicationCache.delete(key);
      }
    }

    if (deduplicationCache.has(dedupKey)) {
      const firstSeenMs = deduplicationCache.get(dedupKey)!;
      const ageSeconds = Math.floor((now - firstSeenMs) / 1000);

      this.logger.warn(
        `[DeduplicationHandler] DUPLICATE detected — alertId=${alert.id}, ` +
          `key=${dedupKey}, age=${ageSeconds}s. Stopping pipeline.`,
      );

      return {
        alert,
        enriched: false,
        handlerName: this.getHandlerName(),
        skipped: true,
        skipReason: 'DUPLICATE',
        durationMs: 0,
        metadata: { dedupKey, firstSeenAgeSeconds: ageSeconds },
      };
    }

    // Not a duplicate — register in cache and continue chain
    deduplicationCache.set(dedupKey, now);

    this.logger.debug(
      `[DeduplicationHandler] Alert ${alert.id} is unique — registered key: ${dedupKey}`,
    );

    // Store dedup key in enrichment context for downstream handlers
    const enrichedAlert: CanonicalAlert = {
      ...alert,
      enrichmentContext: {
        ...alert.enrichmentContext,
        deduplicationKey: dedupKey,
      },
    };

    return {
      alert: enrichedAlert,
      enriched: true,
      handlerName: this.getHandlerName(),
      skipped: false,
      durationMs: 0,
      metadata: { dedupKey, cacheSize: deduplicationCache.size },
    };
  }

  private buildDedupKey(alert: CanonicalAlert): string {
    const { sourceType, normalizedData } = alert;
    const fingerprint = [
      sourceType,
      normalizedData.eventType,
      normalizedData.sourceIp ?? '',
      normalizedData.destinationIp ?? '',
      normalizedData.userId ?? '',
      normalizedData.fileHash ?? '',
    ].join(':');
    return `dedup:${fingerprint}`;
  }

  // Exposed for testing
  static clearCache(): void {
    deduplicationCache.clear();
  }

  static getCacheSize(): number {
    return deduplicationCache.size;
  }
}
