"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rate_limit_proxy_1 = require("../../src/services/proxy/rate-limit.proxy");
const enums_1 = require("../../../../shared/contracts/enums");
describe('RateLimitProxy', () => {
    let rateLimitProxy;
    let mockProvider;
    let configService;
    const mockResult = {
        indicator: '10.0.0.1',
        indicatorType: enums_1.IndicatorType.IP,
        verdict: enums_1.Verdict.CLEAN,
        reputationScore: 0,
        confidenceScore: 80,
        source: enums_1.ThreatIntelSource.VIRUSTOTAL,
        tags: [],
        cachedAt: new Date().toISOString(),
    };
    beforeEach(() => {
        mockProvider = {
            checkReputation: jest.fn().mockResolvedValue(mockResult),
            getProviderName: jest.fn().mockReturnValue(enums_1.ThreatIntelSource.VIRUSTOTAL),
            supports: jest.fn().mockReturnValue(true),
        };
        configService = {
            get: jest.fn().mockImplementation((key, defaultVal) => {
                if (key === 'externalApis.virusTotal.rateLimitPerMinute')
                    return 3;
                return defaultVal;
            }),
        };
        rateLimitProxy = new rate_limit_proxy_1.RateLimitProxy(mockProvider, configService);
    });
    describe('within rate limit', () => {
        it('delegates to real provider for requests within limit', async () => {
            const result = await rateLimitProxy.checkReputation('10.0.0.1', enums_1.IndicatorType.IP);
            expect(result).toEqual(mockResult);
            expect(mockProvider.checkReputation).toHaveBeenCalledWith('10.0.0.1', enums_1.IndicatorType.IP);
        });
        it('allows exactly limit-many requests per minute', async () => {
            await rateLimitProxy.checkReputation('10.0.0.1', enums_1.IndicatorType.IP);
            await rateLimitProxy.checkReputation('10.0.0.2', enums_1.IndicatorType.IP);
            await rateLimitProxy.checkReputation('10.0.0.3', enums_1.IndicatorType.IP);
            expect(mockProvider.checkReputation).toHaveBeenCalledTimes(3);
        });
    });
    describe('exceeding rate limit', () => {
        it('throws RateLimitExceededException on the (limit+1)th request', async () => {
            await rateLimitProxy.checkReputation('10.0.0.1', enums_1.IndicatorType.IP);
            await rateLimitProxy.checkReputation('10.0.0.2', enums_1.IndicatorType.IP);
            await rateLimitProxy.checkReputation('10.0.0.3', enums_1.IndicatorType.IP);
            await expect(rateLimitProxy.checkReputation('10.0.0.4', enums_1.IndicatorType.IP)).rejects.toThrow(rate_limit_proxy_1.RateLimitExceededException);
        });
        it('RateLimitExceededException contains provider name and limit', async () => {
            await rateLimitProxy.checkReputation('10.0.0.1', enums_1.IndicatorType.IP);
            await rateLimitProxy.checkReputation('10.0.0.2', enums_1.IndicatorType.IP);
            await rateLimitProxy.checkReputation('10.0.0.3', enums_1.IndicatorType.IP);
            try {
                await rateLimitProxy.checkReputation('10.0.0.4', enums_1.IndicatorType.IP);
                fail('Expected RateLimitExceededException');
            }
            catch (err) {
                expect(err).toBeInstanceOf(rate_limit_proxy_1.RateLimitExceededException);
                expect(err.limitPerMinute).toBe(3);
                expect(err.provider).toBe(enums_1.ThreatIntelSource.VIRUSTOTAL);
            }
        });
    });
    describe('getProviderName', () => {
        it('wraps provider name with RateLimitProxy label', () => {
            expect(rateLimitProxy.getProviderName()).toBe('RateLimitProxy(VIRUSTOTAL)');
        });
    });
});
//# sourceMappingURL=rate-limit.proxy.spec.js.map