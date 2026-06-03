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
var CustomFeedAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFeedAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const enums_1 = require("../../../../../shared/contracts/enums");
let CustomFeedAdapter = CustomFeedAdapter_1 = class CustomFeedAdapter {
    constructor(httpService, config) {
        this.httpService = httpService;
        this.config = config;
        this.logger = new common_1.Logger(CustomFeedAdapter_1.name);
        this.feedUrl = this.config.get('externalApis.customFeed.url');
        this.apiKey = this.config.get('externalApis.customFeed.apiKey');
    }
    getProviderName() {
        return enums_1.ThreatIntelSource.CUSTOM_FEED;
    }
    supports(type) {
        return [
            enums_1.IndicatorType.IP,
            enums_1.IndicatorType.DOMAIN,
            enums_1.IndicatorType.FILE_HASH,
        ].includes(type);
    }
    async checkReputation(indicator, type) {
        this.logger.debug(`[CustomFeedAdapter] Querying custom feed for ${type}:${indicator}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.feedUrl}/indicators/lookup`, {
                params: {
                    value: indicator,
                    type: type.toLowerCase(),
                },
                headers: {
                    'X-API-Key': this.apiKey,
                    'Accept': 'application/json',
                },
                timeout: 8000,
            }));
            return this.adaptResponse(indicator, type, response.data);
        }
        catch (err) {
            const axiosErr = err;
            if (axiosErr.response?.status === 404) {
                return this.buildUnknownResult(indicator, type, 1800);
            }
            this.logger.error(`[CustomFeedAdapter] API error for ${indicator}: ${axiosErr.message}`);
            throw err;
        }
    }
    adaptResponse(indicator, type, feedResponse) {
        if (!feedResponse.found) {
            return this.buildUnknownResult(indicator, type, feedResponse.ttl ?? 1800);
        }
        const verdict = this.mapClassificationToVerdict(feedResponse.classification);
        const reputationScore = Math.round(feedResponse.risk_score * 10);
        const confidenceScore = feedResponse.confidence;
        const now = new Date();
        const ttlMs = (feedResponse.ttl ?? 3600) * 1000;
        return {
            indicator,
            indicatorType: type,
            verdict,
            reputationScore,
            confidenceScore,
            source: enums_1.ThreatIntelSource.CUSTOM_FEED,
            tags: feedResponse.categories ?? [],
            rawData: feedResponse,
            cachedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
        };
    }
    mapClassificationToVerdict(classification) {
        const lower = classification.toLowerCase();
        if (['malware', 'c2', 'ransomware', 'exploit', 'botnet'].includes(lower)) {
            return enums_1.Verdict.MALICIOUS;
        }
        if (['phishing', 'spam', 'suspicious', 'adware'].includes(lower)) {
            return enums_1.Verdict.SUSPICIOUS;
        }
        if (lower === 'clean') {
            return enums_1.Verdict.CLEAN;
        }
        return enums_1.Verdict.UNKNOWN;
    }
    buildUnknownResult(indicator, type, ttlSeconds) {
        const now = new Date();
        return {
            indicator,
            indicatorType: type,
            verdict: enums_1.Verdict.UNKNOWN,
            reputationScore: 0,
            confidenceScore: 0,
            source: enums_1.ThreatIntelSource.CUSTOM_FEED,
            tags: [],
            cachedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
        };
    }
};
exports.CustomFeedAdapter = CustomFeedAdapter;
exports.CustomFeedAdapter = CustomFeedAdapter = CustomFeedAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], CustomFeedAdapter);
//# sourceMappingURL=custom-feed.adapter.js.map