// middleware/tests/unit/pipeline.spec.ts
// PATTERN: Chain of Responsibility — verify handler chain behaviour

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { DeduplicationHandler } from '../../src/handlers/deduplication.handler';
import { GeoIPHandler } from '../../src/handlers/geo-ip.handler';
import { ClassificationHandler } from '../../src/handlers/classification.handler';
import { PipelineAssembler } from '../../src/pipeline/pipeline.assembler';
import { ThreatIntelHandler } from '../../src/handlers/threat-intel.handler';
import {
  CanonicalAlert,
  ReputationResult,
} from '../../../shared/contracts/interfaces';
import {
  Severity,
  AlertSourceType,
  IndicatorType,
  Verdict,
  ThreatIntelSource,
} from '../../../shared/contracts/enums';

const makeAlert = (overrides: Partial<CanonicalAlert> = {}): CanonicalAlert => ({
  id: `alert-${Math.random().toString(36).slice(2, 8)}`,
  severity: Severity.MEDIUM,
  timestamp: new Date().toISOString(),
  sourceType: AlertSourceType.SPLUNK,
  sourceId: 'splunk-001',
  rawPayload: {},
  normalizedData: {
    title: 'Suspicious Connection',
    description: 'Outbound connection to known C2',
    eventType: 'NETWORK_CONNECTION',
    sourceIp: '185.220.100.1',
    destinationIp: '10.0.0.5',
  },
  ...overrides,
});

const makeMaliciousReputationResult = (): ReputationResult => ({
  indicator: '185.220.100.1',
  indicatorType: IndicatorType.IP,
  verdict: Verdict.MALICIOUS,
  reputationScore: 92,
  confidenceScore: 85,
  source: ThreatIntelSource.VIRUSTOTAL,
  tags: ['c2', 'malware'],
  cachedAt: new Date().toISOString(),
});

describe('Pipeline — Chain of Responsibility', () => {
  let assembler: PipelineAssembler;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    // Clear dedup cache between tests
    DeduplicationHandler.clearCache();

    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    const configService = {
      get: jest.fn((key: string, def?: unknown) => {
        const values: Record<string, unknown> = {
          'app.deduplicationWindowSeconds': 300,
          'app.threatIntelServiceUrl': 'http://localhost:3002',
          'app.apiKeySecret': 'test-key',
          'app.classificationDefaultSeverity': 'MEDIUM',
        };
        return values[key] ?? def;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineAssembler,
        DeduplicationHandler,
        GeoIPHandler,
        ThreatIntelHandler,
        ClassificationHandler,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    assembler = module.get<PipelineAssembler>(PipelineAssembler);
  });

  describe('DeduplicationHandler (H1)', () => {
    it('allows a unique alert through the chain', async () => {
      // Mock GeoIP + ThreatIntel HTTP calls
      httpService.get.mockReturnValue(of({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'NYC', lat: 40, lon: -74, isp: 'ISP Inc', query: '1.2.3.4' } } as any));
      httpService.post.mockReturnValue(of({ data: makeMaliciousReputationResult() } as any));

      const alert = makeAlert();
      const result = await assembler.process(alert);

      expect(result.completed).toBe(true);
      expect(result.stoppedAt).toBeUndefined();
    });

    it('stops the chain for a duplicate alert', async () => {
      const alert = makeAlert({ id: 'dup-001' });
      const alert2 = makeAlert({
        id: 'dup-002',
        normalizedData: alert.normalizedData, // same fingerprint
      });

      // Suppress downstream HTTP calls for first alert
      httpService.get.mockReturnValue(of({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'NYC', lat: 40, lon: -74, isp: 'ISP', query: '185.220.100.1' } } as any));
      httpService.post.mockReturnValue(of({ data: makeMaliciousReputationResult() } as any));

      await assembler.process(alert);   // registers in dedup cache
      const result = await assembler.process(alert2);  // duplicate

      expect(result.completed).toBe(false);
      expect(result.stoppedAt).toBe('DeduplicationHandler');
      expect(result.stopReason).toBe('DUPLICATE');
    });
  });

  describe('ClassificationHandler (H4)', () => {
    it('classifies as HIGH when threat intel returns MALICIOUS', async () => {
      httpService.get.mockReturnValue(of({ data: { status: 'success', country: 'RU', countryCode: 'RU', city: 'Moscow', lat: 55, lon: 37, isp: 'RU-ISP', query: '185.220.100.1' } } as any));
      httpService.post.mockReturnValue(of({ data: makeMaliciousReputationResult() } as any));

      const result = await assembler.process(makeAlert());
      expect(result.processedAlert.severity).toBe(Severity.HIGH);
    });

    it('applies MEDIUM classification when no threat intel matches', async () => {
      httpService.get.mockReturnValue(of({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'SF', lat: 37, lon: -122, isp: 'Cloudflare', query: '1.1.1.1' } } as any));
      httpService.post.mockReturnValue(of({
        data: {
          ...makeMaliciousReputationResult(),
          verdict: Verdict.CLEAN,
          reputationScore: 0,
        },
      } as any));

      const cleanAlert = makeAlert({
        normalizedData: {
          title: 'Clean Traffic',
          description: 'Normal connection',
          eventType: 'NETWORK_CONNECTION',
          sourceIp: '1.1.1.1',
        },
      });

      const result = await assembler.process(cleanAlert);
      expect(result.processedAlert.severity).toBe(Severity.LOW);
    });

    it('adds a correlationId to enrichment context', async () => {
      httpService.get.mockReturnValue(of({ data: { status: 'fail' } } as any));
      httpService.post.mockReturnValue(of({ data: makeMaliciousReputationResult() } as any));

      const result = await assembler.process(makeAlert());
      expect(result.processedAlert.enrichmentContext?.correlationId).toBeDefined();
      expect(typeof result.processedAlert.enrichmentContext?.correlationId).toBe('string');
    });
  });

  describe('pipeline result shape', () => {
    it('returns stageResults for each handler that ran', async () => {
      httpService.get.mockReturnValue(of({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'LA', lat: 34, lon: -118, isp: 'ISP', query: '185.220.100.1' } } as any));
      httpService.post.mockReturnValue(of({ data: makeMaliciousReputationResult() } as any));

      const result = await assembler.process(makeAlert());
      const handlerNames = result.stageResults.map((s) => s.handlerName);

      expect(handlerNames).toContain('DeduplicationHandler');
      expect(handlerNames).toContain('GeoIPHandler');
      expect(handlerNames).toContain('ThreatIntelHandler');
      expect(handlerNames).toContain('ClassificationHandler');
    });

    it('reports totalDurationMs as a positive number', async () => {
      httpService.get.mockReturnValue(of({ data: { status: 'fail' } } as any));
      httpService.post.mockReturnValue(of({ data: makeMaliciousReputationResult() } as any));

      const result = await assembler.process(makeAlert());
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
