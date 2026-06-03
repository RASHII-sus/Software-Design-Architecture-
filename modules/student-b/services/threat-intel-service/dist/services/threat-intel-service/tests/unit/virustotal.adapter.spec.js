"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const virustotal_adapter_1 = require("../../src/services/adapter/virustotal.adapter");
const enums_1 = require("../../../../shared/contracts/enums");
describe('VirusTotalAdapter', () => {
    let adapter;
    let httpService;
    let configService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                virustotal_adapter_1.VirusTotalAdapter,
                {
                    provide: axios_1.HttpService,
                    useValue: { get: jest.fn() },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            const config = {
                                'externalApis.virusTotal.baseUrl': 'https://www.virustotal.com/api/v3',
                                'externalApis.virusTotal.apiKey': 'test-api-key',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();
        adapter = module.get(virustotal_adapter_1.VirusTotalAdapter);
        httpService = module.get(axios_1.HttpService);
        configService = module.get(config_1.ConfigService);
    });
    describe('getProviderName', () => {
        it('returns VIRUSTOTAL', () => {
            expect(adapter.getProviderName()).toBe(enums_1.ThreatIntelSource.VIRUSTOTAL);
        });
    });
    describe('supports', () => {
        it('returns true for IP, DOMAIN, FILE_HASH, URL', () => {
            expect(adapter.supports(enums_1.IndicatorType.IP)).toBe(true);
            expect(adapter.supports(enums_1.IndicatorType.DOMAIN)).toBe(true);
            expect(adapter.supports(enums_1.IndicatorType.FILE_HASH)).toBe(true);
            expect(adapter.supports(enums_1.IndicatorType.URL)).toBe(true);
        });
        it('returns false for EMAIL', () => {
            expect(adapter.supports(enums_1.IndicatorType.EMAIL)).toBe(false);
        });
    });
    describe('checkReputation', () => {
        it('returns MALICIOUS verdict for IP with 10 malicious detections', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: mockVTMaliciousResponse }));
            const result = await adapter.checkReputation('8.8.8.8', enums_1.IndicatorType.IP);
            expect(result.verdict).toBe(enums_1.Verdict.MALICIOUS);
            expect(result.reputationScore).toBeGreaterThan(0);
            expect(result.source).toBe(enums_1.ThreatIntelSource.VIRUSTOTAL);
            expect(result.indicator).toBe('8.8.8.8');
            expect(result.indicatorType).toBe(enums_1.IndicatorType.IP);
        });
        it('returns CLEAN verdict for IP with 0 malicious detections', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: mockVTCleanResponse }));
            const result = await adapter.checkReputation('1.1.1.1', enums_1.IndicatorType.IP);
            expect(result.verdict).toBe(enums_1.Verdict.CLEAN);
            expect(result.reputationScore).toBe(0);
        });
        it('returns UNKNOWN when indicator is not found (404)', async () => {
            const axiosError = Object.assign(new Error('Not found'), {
                response: { status: 404 },
                isAxiosError: true,
            });
            httpService.get.mockReturnValue((0, rxjs_1.throwError)(() => axiosError));
            const result = await adapter.checkReputation('unknown-ip', enums_1.IndicatorType.IP);
            expect(result.verdict).toBe(enums_1.Verdict.UNKNOWN);
            expect(result.reputationScore).toBe(0);
        });
        it('throws error for non-404 API failures', async () => {
            const axiosError = Object.assign(new Error('Internal Server Error'), {
                response: { status: 500 },
                isAxiosError: true,
            });
            httpService.get.mockReturnValue((0, rxjs_1.throwError)(() => axiosError));
            await expect(adapter.checkReputation('8.8.8.8', enums_1.IndicatorType.IP)).rejects.toThrow();
        });
        it('calls correct VT endpoint for domain lookup', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: mockVTCleanResponse }));
            await adapter.checkReputation('example.com', enums_1.IndicatorType.DOMAIN);
            expect(httpService.get).toHaveBeenCalledWith(expect.stringContaining('/domains/example.com'), expect.any(Object));
        });
        it('result includes non-expired expiresAt', async () => {
            httpService.get.mockReturnValue((0, rxjs_1.of)({ data: mockVTCleanResponse }));
            const result = await adapter.checkReputation('1.1.1.1', enums_1.IndicatorType.IP);
            const expiresAt = new Date(result.expiresAt);
            expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
        });
    });
});
//# sourceMappingURL=virustotal.adapter.spec.js.map