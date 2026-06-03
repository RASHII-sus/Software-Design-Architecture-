"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ThreatIntelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelService = void 0;
const common_1 = require("@nestjs/common");
const threat_intel_provider_interface_1 = require("./adapter/threat-intel-provider.interface");
const virustotal_adapter_1 = require("./adapter/virustotal.adapter");
const misp_adapter_1 = require("./adapter/misp.adapter");
const custom_feed_adapter_1 = require("./adapter/custom-feed.adapter");
const threat_intel_cache_service_1 = require("./threat-intel-cache.service");
const threat_indicator_repository_1 = require("../domain/repositories/threat-indicator.repository");
const threat_intel_event_publisher_1 = require("../events/threat-intel-event.publisher");
const enums_1 = require("../../../../shared/contracts/enums");
let ThreatIntelService = ThreatIntelService_1 = class ThreatIntelService {
    constructor(defaultProvider, virusTotalAdapter, mispAdapter, customFeedAdapter, cacheService, indicatorRepository, eventPublisher) {
        this.defaultProvider = defaultProvider;
        this.virusTotalAdapter = virusTotalAdapter;
        this.mispAdapter = mispAdapter;
        this.customFeedAdapter = customFeedAdapter;
        this.cacheService = cacheService;
        this.indicatorRepository = indicatorRepository;
        this.eventPublisher = eventPublisher;
        this.logger = new common_1.Logger(ThreatIntelService_1.name);
        this.providerRegistry = new Map([
            [enums_1.ThreatIntelSource.VIRUSTOTAL, virusTotalAdapter],
            [enums_1.ThreatIntelSource.MISP, mispAdapter],
            [enums_1.ThreatIntelSource.CUSTOM_FEED, customFeedAdapter],
        ]);
    }
    async checkReputation(dto) {
        this.logger.log(`[ThreatIntelService] Checking reputation: ${dto.indicatorType}:${dto.indicator}` +
            (dto.source ? ` via ${dto.source}` : ' via default provider'));
        const provider = dto.source
            ? this.resolveProviderBySource(dto.source)
            : this.defaultProvider;
        const result = await provider.checkReputation(dto.indicator, dto.indicatorType);
        await this.persistResult(result);
        if (result.verdict === enums_1.Verdict.MALICIOUS || result.verdict === enums_1.Verdict.SUSPICIOUS) {
            await this.eventPublisher.publishThreatIntelUpdated(result);
        }
        return result;
    }
    async bulkCheckReputation(dto) {
        this.logger.log(`[ThreatIntelService] Bulk reputation check for ${dto.indicators.length} indicators`);
        const results = await Promise.allSettled(dto.indicators.map((ind) => this.checkReputation({
            indicator: ind.indicator,
            indicatorType: ind.indicatorType,
            source: dto.source,
        })));
        return results.map((r, i) => {
            if (r.status === 'fulfilled')
                return r.value;
            this.logger.error(`[ThreatIntelService] Bulk check failed for ${dto.indicators[i].indicator}: ${r.reason}`);
            return {
                indicator: dto.indicators[i].indicator,
                indicatorType: dto.indicators[i].indicatorType,
                verdict: enums_1.Verdict.UNKNOWN,
                reputationScore: 0,
                confidenceScore: 0,
                source: enums_1.ThreatIntelSource.VIRUSTOTAL,
                tags: [],
                cachedAt: new Date().toISOString(),
            };
        });
    }
    async getIndicatorHistory(indicator, source) {
        return this.indicatorRepository.findByIndicator(indicator, source);
    }
    async getMaliciousIndicators(limit = 50) {
        return this.indicatorRepository.findMaliciousIndicators(limit);
    }
    async getStats() {
        const [verdictCounts, cacheStats] = await Promise.all([
            this.indicatorRepository.countByVerdict(),
            this.cacheService.getCacheStats(),
        ]);
        return { verdictCounts, cacheStats };
    }
    async invalidateCache(indicator, type) {
        await this.cacheService.invalidate(indicator, type);
        this.logger.log(`[ThreatIntelService] Cache invalidated for ${indicator}`);
    }
    resolveProviderBySource(source) {
        const provider = this.providerRegistry.get(source);
        if (!provider) {
            throw new Error(`No provider registered for source: ${source}`);
        }
        return provider;
    }
    async persistResult(result) {
        try {
            await this.indicatorRepository.upsert({
                indicator: result.indicator,
                indicatorType: result.indicatorType,
                verdict: result.verdict,
                confidenceScore: result.confidenceScore,
                reputationScore: result.reputationScore,
                source: result.source,
                rawResponse: result.rawData,
                tags: result.tags,
                expiresAt: result.expiresAt ? new Date(result.expiresAt) : undefined,
            });
        }
        catch (err) {
            this.logger.error(`[ThreatIntelService] Failed to persist result for ${result.indicator}: ${err.message}`);
        }
    }
};
exports.ThreatIntelService = ThreatIntelService;
exports.ThreatIntelService = ThreatIntelService = ThreatIntelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(threat_intel_provider_interface_1.THREAT_INTEL_PROVIDER)),
    __metadata("design:paramtypes", [Object, virustotal_adapter_1.VirusTotalAdapter,
        misp_adapter_1.MISPAdapter,
        custom_feed_adapter_1.CustomFeedAdapter,
        threat_intel_cache_service_1.ThreatIntelCacheService,
        threat_indicator_repository_1.ThreatIndicatorRepository,
        threat_intel_event_publisher_1.ThreatIntelEventPublisher])
], ThreatIntelService);
//# sourceMappingURL=threat-intel.service.js.map