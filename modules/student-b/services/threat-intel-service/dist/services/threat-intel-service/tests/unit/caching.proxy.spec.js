"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caching_proxy_1 = require("../../src/services/proxy/caching.proxy");
const enums_1 = require("../../../../shared/contracts/enums");
describe('CachingProxy', () => {
    let cachingProxy;
    let mockProvider;
    let mockCacheService;
    const mockResult = {
        indicator: '192.168.1.1',
        indicatorType: enums_1.IndicatorType.IP,
        verdict: enums_1.Verdict.MALICIOUS,
        reputationScore: 85,
        confidenceScore: 90,
        source: enums_1.ThreatIntelSource.VIRUSTOTAL,
        tags: ['malware', 'c2'],
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
    beforeEach(() => {
        mockProvider = {
            checkReputation: jest.fn(),
            getProviderName: jest.fn().mockReturnValue(enums_1.ThreatIntelSource.VIRUSTOTAL),
            supports: jest.fn().mockReturnValue(true),
        };
        mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
            buildCacheKey: jest.fn(),
            getCacheStats: jest.fn(),
        };
        cachingProxy = new caching_proxy_1.CachingProxy(mockProvider, mockCacheService);
    });
    describe('getProviderName', () => {
        it('wraps provider name with CachingProxy label', () => {
            expect(cachingProxy.getProviderName()).toBe('CachingProxy(VIRUSTOTAL)');
        });
    });
    describe('checkReputation — cache HIT', () => {
        it('returns cached result without calling real provider', async () => {
            mockCacheService.get.mockResolvedValue(mockResult);
            const result = await cachingProxy.checkReputation('192.168.1.1', enums_1.IndicatorType.IP);
            expect(result).toEqual(mockResult);
            expect(mockProvider.checkReputation).not.toHaveBeenCalled();
            expect(mockCacheService.get).toHaveBeenCalledWith('192.168.1.1', enums_1.IndicatorType.IP, enums_1.ThreatIntelSource.VIRUSTOTAL);
        });
    });
    describe('checkReputation — cache MISS', () => {
        it('calls real provider and stores result in cache', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockProvider.checkReputation.mockResolvedValue(mockResult);
            mockCacheService.set.mockResolvedValue(undefined);
            const result = await cachingProxy.checkReputation('192.168.1.1', enums_1.IndicatorType.IP);
            expect(result).toEqual(mockResult);
            expect(mockProvider.checkReputation).toHaveBeenCalledWith('192.168.1.1', enums_1.IndicatorType.IP);
            expect(mockCacheService.set).toHaveBeenCalledWith(mockResult);
        });
    });
    describe('checkReputation — cache error resilience', () => {
        it('proceeds to real provider when cache GET throws', async () => {
            mockCacheService.get.mockRejectedValue(new Error('Redis unavailable'));
            mockCacheService.get.mockResolvedValue(null);
            mockProvider.checkReputation.mockResolvedValue(mockResult);
            const result = await cachingProxy.checkReputation('192.168.1.1', enums_1.IndicatorType.IP);
            expect(result).toEqual(mockResult);
        });
    });
    describe('supports', () => {
        it('delegates to real provider', () => {
            expect(cachingProxy.supports(enums_1.IndicatorType.IP)).toBe(true);
            expect(mockProvider.supports).toHaveBeenCalledWith(enums_1.IndicatorType.IP);
        });
    });
});
//# sourceMappingURL=caching.proxy.spec.js.map