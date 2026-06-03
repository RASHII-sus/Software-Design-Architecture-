// services/threat-intel-service/tests/unit/rate-limit.proxy.spec.ts

import { ConfigService } from '@nestjs/config';
import { RateLimitProxy, RateLimitExceededException } from '../../src/services/proxy/rate-limit.proxy';
import { ThreatIntelProvider } from '../../src/services/adapter/threat-intel-provider.interface';
import { IndicatorType, Verdict, ThreatIntelSource } from '../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../shared/contracts/interfaces';

describe('RateLimitProxy', () => {
  // PATTERN: Proxy — test rate limiting enforcement
  let rateLimitProxy: RateLimitProxy;
  let mockProvider: jest.Mocked<ThreatIntelProvider>;
  let configService: jest.Mocked<ConfigService>;

  const mockResult: ReputationResult = {
    indicator: '10.0.0.1',
    indicatorType: IndicatorType.IP,
    verdict: Verdict.CLEAN,
    reputationScore: 0,
    confidenceScore: 80,
    source: ThreatIntelSource.VIRUSTOTAL,
    tags: [],
    cachedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockProvider = {
      checkReputation: jest.fn().mockResolvedValue(mockResult),
      getProviderName: jest.fn().mockReturnValue(ThreatIntelSource.VIRUSTOTAL),
      supports: jest.fn().mockReturnValue(true),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal?: unknown) => {
        if (key === 'externalApis.virusTotal.rateLimitPerMinute') return 3;
        return defaultVal;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    rateLimitProxy = new RateLimitProxy(mockProvider, configService);
  });

  describe('within rate limit', () => {
    it('delegates to real provider for requests within limit', async () => {
      const result = await rateLimitProxy.checkReputation('10.0.0.1', IndicatorType.IP);

      expect(result).toEqual(mockResult);
      expect(mockProvider.checkReputation).toHaveBeenCalledWith('10.0.0.1', IndicatorType.IP);
    });

    it('allows exactly limit-many requests per minute', async () => {
      // Limit is 3
      await rateLimitProxy.checkReputation('10.0.0.1', IndicatorType.IP);
      await rateLimitProxy.checkReputation('10.0.0.2', IndicatorType.IP);
      await rateLimitProxy.checkReputation('10.0.0.3', IndicatorType.IP);

      expect(mockProvider.checkReputation).toHaveBeenCalledTimes(3);
    });
  });

  describe('exceeding rate limit', () => {
    it('throws RateLimitExceededException on the (limit+1)th request', async () => {
      // Exhaust the 3-per-minute limit
      await rateLimitProxy.checkReputation('10.0.0.1', IndicatorType.IP);
      await rateLimitProxy.checkReputation('10.0.0.2', IndicatorType.IP);
      await rateLimitProxy.checkReputation('10.0.0.3', IndicatorType.IP);

      await expect(
        rateLimitProxy.checkReputation('10.0.0.4', IndicatorType.IP),
      ).rejects.toThrow(RateLimitExceededException);
    });

    it('RateLimitExceededException contains provider name and limit', async () => {
      await rateLimitProxy.checkReputation('10.0.0.1', IndicatorType.IP);
      await rateLimitProxy.checkReputation('10.0.0.2', IndicatorType.IP);
      await rateLimitProxy.checkReputation('10.0.0.3', IndicatorType.IP);

      try {
        await rateLimitProxy.checkReputation('10.0.0.4', IndicatorType.IP);
        fail('Expected RateLimitExceededException');
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitExceededException);
        expect((err as RateLimitExceededException).limitPerMinute).toBe(3);
        expect((err as RateLimitExceededException).provider).toBe(ThreatIntelSource.VIRUSTOTAL);
      }
    });
  });

  describe('getProviderName', () => {
    it('wraps provider name with RateLimitProxy label', () => {
      expect(rateLimitProxy.getProviderName()).toBe('RateLimitProxy(VIRUSTOTAL)');
    });
  });
});
