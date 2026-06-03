// services/threat-intel-service/src/threat-intel.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Entities
import { ThreatIndicatorEntity } from './domain/entities/threat-indicator.entity';

// Repositories
import { ThreatIndicatorRepository } from './domain/repositories/threat-indicator.repository';

// Controllers
import { ThreatIntelController } from './controllers/threat-intel.controller';

// Adapters — PATTERN: Adapter
import { VirusTotalAdapter } from './services/adapter/virustotal.adapter';
import { MISPAdapter } from './services/adapter/misp.adapter';
import { CustomFeedAdapter } from './services/adapter/custom-feed.adapter';

// Proxies — PATTERN: Proxy
import { CachingProxy } from './services/proxy/caching.proxy';
import { RateLimitProxy } from './services/proxy/rate-limit.proxy';
import { AccessControlProxy } from './services/proxy/access-control.proxy';

// Services
import { ThreatIntelService } from './services/threat-intel.service';
import { ThreatIntelCacheService } from './services/threat-intel-cache.service';
import { ThreatIntelEventPublisher } from './events/threat-intel-event.publisher';

// Redis
import { createClient } from 'redis';
import { RedisModule } from './config/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ThreatIndicatorEntity]),
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: 10000,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'SDA-Pro-ThreatIntel/1.0',
        },
      }),
    }),
    RedisModule,
  ],
  controllers: [ThreatIntelController],
  providers: [
    // Repository
    ThreatIndicatorRepository,

    // Adapters — PATTERN: Adapter
    // Each adapter wraps a different external API and normalizes output
    VirusTotalAdapter,
    MISPAdapter,
    CustomFeedAdapter,

    // Cache Service
    ThreatIntelCacheService,

    // Event Publisher
    ThreatIntelEventPublisher,

    // Main service — receives proxy-wrapped provider
    ThreatIntelService,

    // Proxy chain factory — PATTERN: Proxy
    // CachingProxy wraps RateLimitProxy wraps AccessControlProxy wraps real adapter
    {
      provide: 'THREAT_INTEL_PROVIDER',
      useFactory: (
        vtAdapter: VirusTotalAdapter,
        mispAdapter: MISPAdapter,
        cacheService: ThreatIntelCacheService,
        config: ConfigService,
      ) => {
        // Build stacked proxy: AccessControl → RateLimit → Caching → Real Provider
        const accessControlProxy = new AccessControlProxy(vtAdapter, config);
        const rateLimitProxy = new RateLimitProxy(accessControlProxy, config);
        const cachingProxy = new CachingProxy(rateLimitProxy, cacheService);
        return cachingProxy;
      },
      inject: [VirusTotalAdapter, MISPAdapter, ThreatIntelCacheService, ConfigService],
    },
  ],
  exports: [ThreatIntelService],
})
export class ThreatIntelModule {}
