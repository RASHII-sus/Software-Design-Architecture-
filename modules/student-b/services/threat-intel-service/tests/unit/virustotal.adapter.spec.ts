// services/threat-intel-service/tests/unit/virustotal.adapter.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { VirusTotalAdapter } from '../../src/services/adapter/virustotal.adapter';
import { IndicatorType, Verdict, ThreatIntelSource } from '../../../../shared/contracts/enums';

describe('VirusTotalAdapter', () => {
  let adapter: VirusTotalAdapter;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockVTMaliciousResponse = {
    data: {
      id: '8.8.8.8',
      type: 'ip_address',
      attributes: {
        last_analysis_stats: {
          malicious: 10,
          suspicious: 2,
          undetected: 50,
          harmless: 5,
          timeout: 0,
        },
        tags: ['scanner', 'vpn'],
        reputation: -10,
      },
    },
  };

  const mockVTCleanResponse = {
    data: {
      id: '1.1.1.1',
      type: 'ip_address',
      attributes: {
        last_analysis_stats: {
          malicious: 0,
          suspicious: 0,
          undetected: 10,
          harmless: 60,
          timeout: 0,
        },
        tags: ['cloudflare'],
        reputation: 100,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirusTotalAdapter,
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'externalApis.virusTotal.baseUrl': 'https://www.virustotal.com/api/v3',
                'externalApis.virusTotal.apiKey': 'test-api-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    adapter = module.get<VirusTotalAdapter>(VirusTotalAdapter);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  describe('getProviderName', () => {
    it('returns VIRUSTOTAL', () => {
      expect(adapter.getProviderName()).toBe(ThreatIntelSource.VIRUSTOTAL);
    });
  });

  describe('supports', () => {
    it('returns true for IP, DOMAIN, FILE_HASH, URL', () => {
      expect(adapter.supports(IndicatorType.IP)).toBe(true);
      expect(adapter.supports(IndicatorType.DOMAIN)).toBe(true);
      expect(adapter.supports(IndicatorType.FILE_HASH)).toBe(true);
      expect(adapter.supports(IndicatorType.URL)).toBe(true);
    });

    it('returns false for EMAIL', () => {
      expect(adapter.supports(IndicatorType.EMAIL)).toBe(false);
    });
  });

  describe('checkReputation', () => {
    it('returns MALICIOUS verdict for IP with 10 malicious detections', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({ data: mockVTMaliciousResponse } as AxiosResponse),
      );

      const result = await adapter.checkReputation('8.8.8.8', IndicatorType.IP);

      expect(result.verdict).toBe(Verdict.MALICIOUS);
      expect(result.reputationScore).toBeGreaterThan(0);
      expect(result.source).toBe(ThreatIntelSource.VIRUSTOTAL);
      expect(result.indicator).toBe('8.8.8.8');
      expect(result.indicatorType).toBe(IndicatorType.IP);
    });

    it('returns CLEAN verdict for IP with 0 malicious detections', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({ data: mockVTCleanResponse } as AxiosResponse),
      );

      const result = await adapter.checkReputation('1.1.1.1', IndicatorType.IP);

      expect(result.verdict).toBe(Verdict.CLEAN);
      expect(result.reputationScore).toBe(0);
    });

    it('returns UNKNOWN when indicator is not found (404)', async () => {
      const axiosError = Object.assign(new Error('Not found'), {
        response: { status: 404 },
        isAxiosError: true,
      });
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => axiosError));

      const result = await adapter.checkReputation('unknown-ip', IndicatorType.IP);

      expect(result.verdict).toBe(Verdict.UNKNOWN);
      expect(result.reputationScore).toBe(0);
    });

    it('throws error for non-404 API failures', async () => {
      const axiosError = Object.assign(new Error('Internal Server Error'), {
        response: { status: 500 },
        isAxiosError: true,
      });
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => axiosError));

      await expect(
        adapter.checkReputation('8.8.8.8', IndicatorType.IP),
      ).rejects.toThrow();
    });

    it('calls correct VT endpoint for domain lookup', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({ data: mockVTCleanResponse } as AxiosResponse),
      );

      await adapter.checkReputation('example.com', IndicatorType.DOMAIN);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/domains/example.com'),
        expect.any(Object),
      );
    });

    it('result includes non-expired expiresAt', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({ data: mockVTCleanResponse } as AxiosResponse),
      );

      const result = await adapter.checkReputation('1.1.1.1', IndicatorType.IP);
      const expiresAt = new Date(result.expiresAt!);

      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
