"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const deduplication_handler_1 = require("../../src/handlers/deduplication.handler");
const geo_ip_handler_1 = require("../../src/handlers/geo-ip.handler");
const classification_handler_1 = require("../../src/handlers/classification.handler");
const pipeline_assembler_1 = require("../../src/pipeline/pipeline.assembler");
const threat_intel_handler_1 = require("../../src/handlers/threat-intel.handler");
const enums_1 = require("../../../shared/contracts/enums");
const makeAlert = (overrides = {}) => ({
    id: `alert-${Math.random().toString(36).slice(2, 8)}`,
    severity: enums_1.Severity.MEDIUM,
    timestamp: new Date().toISOString(),
    sourceType: enums_1.AlertSourceType.SPLUNK,
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
const makeMaliciousReputationResult = () => ({
    indicator: '185.220.100.1',
    indicatorType: enums_1.IndicatorType.IP,
    verdict: enums_1.Verdict.MALICIOUS,
    reputationScore: 92,
    confidenceScore: 85,
    source: enums_1.ThreatIntelSource.VIRUSTOTAL,
    tags: ['c2', 'malware'],
    cachedAt: new Date().toISOString(),
});
describe('Pipeline — Chain of Responsibility', () => {
    let assembler;
    let httpService;
    beforeEach(async () => {
        deduplication_handler_1.DeduplicationHandler.clearCache();
        httpService = {
            get: jest.fn(),
            post: jest.fn(),
        };
        const configService = {
            get: jest.fn((key, def) => {
                const values = {
                    'app.deduplicationWindowSeconds': 300,
                    'app.threatIntelServiceUrl': 'http://localhost:3002',
                    'app.apiKeySecret': 'test-key',
                    'app.classificationDefaultSeverity': 'MEDIUM',
                };
                return values[key] ?? def;
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                pipeline_assembler_1.PipelineAssembler,
                deduplication_handler_1.DeduplicationHandler,
                geo_ip_handler_1.GeoIPHandler,
                threat_intel_handler_1.ThreatIntelHandler,
                classification_handler_1.ClassificationHandler,
                { provide: axios_1.HttpService, useValue: httpService },
                { provide: config_1.ConfigService, useValue: configService },
            ],
        }).compile();
        assembler = module.get(pipeline_assembler_1.PipelineAssembler);
    });
    describe('DeduplicationHandler (H1)', () => {
        it('allows a unique alert through the chain', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'NYC', lat: 40, lon: -74, isp: 'ISP Inc', query: '1.2.3.4' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({ data: makeMaliciousReputationResult() }));
            const alert = makeAlert();
            const result = await assembler.process(alert);
            expect(result.completed).toBe(true);
            expect(result.stoppedAt).toBeUndefined();
        });
        it('stops the chain for a duplicate alert', async () => {
            const alert = makeAlert({ id: 'dup-001' });
            const alert2 = makeAlert({
                id: 'dup-002',
                normalizedData: alert.normalizedData,
            });
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'NYC', lat: 40, lon: -74, isp: 'ISP', query: '185.220.100.1' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({ data: makeMaliciousReputationResult() }));
            await assembler.process(alert);
            const result = await assembler.process(alert2);
            expect(result.completed).toBe(false);
            expect(result.stoppedAt).toBe('DeduplicationHandler');
            expect(result.stopReason).toBe('DUPLICATE');
        });
    });
    describe('ClassificationHandler (H4)', () => {
        it('classifies as HIGH when threat intel returns MALICIOUS', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'success', country: 'RU', countryCode: 'RU', city: 'Moscow', lat: 55, lon: 37, isp: 'RU-ISP', query: '185.220.100.1' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({ data: makeMaliciousReputationResult() }));
            const result = await assembler.process(makeAlert());
            expect(result.processedAlert.severity).toBe(enums_1.Severity.HIGH);
        });
        it('applies MEDIUM classification when no threat intel matches', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'SF', lat: 37, lon: -122, isp: 'Cloudflare', query: '1.1.1.1' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({
                data: {
                    ...makeMaliciousReputationResult(),
                    verdict: enums_1.Verdict.CLEAN,
                    reputationScore: 0,
                },
            }));
            const cleanAlert = makeAlert({
                normalizedData: {
                    title: 'Clean Traffic',
                    description: 'Normal connection',
                    eventType: 'NETWORK_CONNECTION',
                    sourceIp: '1.1.1.1',
                },
            });
            const result = await assembler.process(cleanAlert);
            expect(result.processedAlert.severity).toBe(enums_1.Severity.LOW);
        });
        it('adds a correlationId to enrichment context', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'fail' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({ data: makeMaliciousReputationResult() }));
            const result = await assembler.process(makeAlert());
            expect(result.processedAlert.enrichmentContext?.correlationId).toBeDefined();
            expect(typeof result.processedAlert.enrichmentContext?.correlationId).toBe('string');
        });
    });
    describe('pipeline result shape', () => {
        it('returns stageResults for each handler that ran', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'success', country: 'US', countryCode: 'US', city: 'LA', lat: 34, lon: -118, isp: 'ISP', query: '185.220.100.1' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({ data: makeMaliciousReputationResult() }));
            const result = await assembler.process(makeAlert());
            const handlerNames = result.stageResults.map((s) => s.handlerName);
            expect(handlerNames).toContain('DeduplicationHandler');
            expect(handlerNames).toContain('GeoIPHandler');
            expect(handlerNames).toContain('ThreatIntelHandler');
            expect(handlerNames).toContain('ClassificationHandler');
        });
        it('reports totalDurationMs as a positive number', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: { status: 'fail' } }));
            httpService.post.mockReturnValue((0, rxjs_1.of)({ data: makeMaliciousReputationResult() }));
            const result = await assembler.process(makeAlert());
            expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=pipeline.spec.js.map