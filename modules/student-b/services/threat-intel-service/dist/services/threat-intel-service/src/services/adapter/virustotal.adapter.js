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
var VirusTotalAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirusTotalAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const enums_1 = require("../../../../../shared/contracts/enums");
let VirusTotalAdapter = VirusTotalAdapter_1 = class VirusTotalAdapter {
    constructor(httpService, config) {
        this.httpService = httpService;
        this.config = config;
        this.logger = new common_1.Logger(VirusTotalAdapter_1.name);
        this.baseUrl = this.config.get('externalApis.virusTotal.baseUrl');
        this.apiKey = this.config.get('externalApis.virusTotal.apiKey');
    }
    getProviderName() {
        return enums_1.ThreatIntelSource.VIRUSTOTAL;
    }
    supports(type) {
        return [
            enums_1.IndicatorType.IP,
            enums_1.IndicatorType.DOMAIN,
            enums_1.IndicatorType.FILE_HASH,
            enums_1.IndicatorType.URL,
        ].includes(type);
    }
    async checkReputation(indicator, type) {
        this.logger.debug(`[VirusTotalAdapter] Checking reputation for ${type}:${indicator}`);
        try {
            const endpoint = this.buildEndpoint(indicator, type);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(endpoint, {
                headers: {
                    'x-apikey': this.apiKey,
                    'Accept': 'application/json',
                },
                timeout: 8000,
            }));
            return this.adaptResponse(indicator, type, response.data);
        }
        catch (err) {
            const axiosErr = err;
            if (axiosErr.response?.status === 404) {
                return this.buildUnknownResult(indicator, type);
            }
            this.logger.error(`[VirusTotalAdapter] API error for ${indicator}: ${axiosErr.message}`, axiosErr.stack);
            throw err;
        }
    }
    buildEndpoint(indicator, type) {
        switch (type) {
            case enums_1.IndicatorType.IP:
                return `${this.baseUrl}/ip_addresses/${encodeURIComponent(indicator)}`;
            case enums_1.IndicatorType.DOMAIN:
                return `${this.baseUrl}/domains/${encodeURIComponent(indicator)}`;
            case enums_1.IndicatorType.FILE_HASH:
                return `${this.baseUrl}/files/${encodeURIComponent(indicator)}`;
            case enums_1.IndicatorType.URL: {
                const encoded = Buffer.from(indicator).toString('base64url');
                return `${this.baseUrl}/urls/${encoded}`;
            }
            default:
                throw new Error(`VirusTotalAdapter does not support indicator type: ${type}`);
        }
    }
    adaptResponse(indicator, type, vtResponse) {
        const attrs = vtResponse.data.attributes;
        const stats = attrs.last_analysis_stats;
        const totalEngines = stats.malicious + stats.suspicious + stats.undetected + stats.harmless + stats.timeout;
        const positives = stats.malicious + stats.suspicious;
        const verdict = this.calculateVerdict(stats);
        const reputationScore = totalEngines > 0
            ? Math.round((positives / totalEngines) * 100)
            : 0;
        const confidenceScore = totalEngines > 0
            ? Math.min(Math.round((totalEngines / 70) * 100), 100)
            : 0;
        const rawTags = attrs.tags ?? [];
        const now = new Date();
        return {
            indicator,
            indicatorType: type,
            verdict,
            reputationScore,
            confidenceScore,
            source: enums_1.ThreatIntelSource.VIRUSTOTAL,
            tags: rawTags,
            rawData: vtResponse,
            cachedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + 3600 * 1000).toISOString(),
        };
    }
    calculateVerdict(stats) {
        if (stats.malicious >= 3)
            return enums_1.Verdict.MALICIOUS;
        if (stats.malicious >= 1 || stats.suspicious >= 3)
            return enums_1.Verdict.SUSPICIOUS;
        if (stats.harmless > 0 || stats.undetected > 0)
            return enums_1.Verdict.CLEAN;
        return enums_1.Verdict.UNKNOWN;
    }
    buildUnknownResult(indicator, type) {
        const now = new Date();
        return {
            indicator,
            indicatorType: type,
            verdict: enums_1.Verdict.UNKNOWN,
            reputationScore: 0,
            confidenceScore: 0,
            source: enums_1.ThreatIntelSource.VIRUSTOTAL,
            tags: [],
            cachedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + 1800 * 1000).toISOString(),
        };
    }
};
exports.VirusTotalAdapter = VirusTotalAdapter;
exports.VirusTotalAdapter = VirusTotalAdapter = VirusTotalAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], VirusTotalAdapter);
//# sourceMappingURL=virustotal.adapter.js.map