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
var MISPAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MISPAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const enums_1 = require("../../../../../shared/contracts/enums");
let MISPAdapter = MISPAdapter_1 = class MISPAdapter {
    constructor(httpService, config) {
        this.httpService = httpService;
        this.config = config;
        this.logger = new common_1.Logger(MISPAdapter_1.name);
        this.baseUrl = this.config.get('externalApis.misp.baseUrl');
        this.authKey = this.config.get('externalApis.misp.authKey');
    }
    getProviderName() {
        return enums_1.ThreatIntelSource.MISP;
    }
    supports(type) {
        return [
            enums_1.IndicatorType.IP,
            enums_1.IndicatorType.DOMAIN,
            enums_1.IndicatorType.FILE_HASH,
            enums_1.IndicatorType.URL,
            enums_1.IndicatorType.EMAIL,
        ].includes(type);
    }
    async checkReputation(indicator, type) {
        this.logger.debug(`[MISPAdapter] Querying MISP for ${type}:${indicator}`);
        try {
            const mispTypes = this.mapIndicatorTypeToMISP(type);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/attributes/restSearch`, {
                returnFormat: 'json',
                value: indicator,
                type: mispTypes,
                limit: 20,
                page: 1,
                includeEventTags: true,
            }, {
                headers: {
                    'Authorization': this.authKey,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }));
            return this.adaptResponse(indicator, type, response.data);
        }
        catch (err) {
            const axiosErr = err;
            this.logger.error(`[MISPAdapter] API error for ${indicator}: ${axiosErr.message}`);
            throw err;
        }
    }
    adaptResponse(indicator, type, mispResponse) {
        const attributes = mispResponse.response?.Attribute ?? [];
        if (attributes.length === 0) {
            return this.buildUnknownResult(indicator, type);
        }
        let maxThreatLevel = 4;
        let iocCount = 0;
        const allTags = new Set();
        for (const attr of attributes) {
            if (attr.to_ids) {
                iocCount++;
            }
            const eventThreatLevel = parseInt(attr.Event?.threat_level_id ?? '4', 10);
            if (eventThreatLevel < maxThreatLevel) {
                maxThreatLevel = eventThreatLevel;
            }
            for (const tag of attr.tags ?? []) {
                if (!tag.is_galaxy) {
                    allTags.add(tag.name);
                }
            }
        }
        const verdict = this.mapThreatLevelToVerdict(maxThreatLevel, iocCount, attributes.length);
        const reputationScore = this.calculateReputationScore(maxThreatLevel, iocCount, attributes.length);
        const confidenceScore = Math.min(attributes.length * 10, 100);
        const now = new Date();
        return {
            indicator,
            indicatorType: type,
            verdict,
            reputationScore,
            confidenceScore,
            source: enums_1.ThreatIntelSource.MISP,
            tags: Array.from(allTags),
            rawData: mispResponse,
            cachedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + 3600 * 1000).toISOString(),
        };
    }
    mapIndicatorTypeToMISP(type) {
        const mapping = {
            [enums_1.IndicatorType.IP]: ['ip-src', 'ip-dst', 'ip-src|port', 'ip-dst|port'],
            [enums_1.IndicatorType.DOMAIN]: ['domain', 'hostname', 'domain|ip'],
            [enums_1.IndicatorType.FILE_HASH]: ['md5', 'sha1', 'sha256', 'sha512', 'filename|md5', 'filename|sha256'],
            [enums_1.IndicatorType.URL]: ['url', 'uri'],
            [enums_1.IndicatorType.EMAIL]: ['email-src', 'email-dst', 'email-subject'],
        };
        return mapping[type] ?? [type.toLowerCase()];
    }
    mapThreatLevelToVerdict(threatLevel, iocCount, totalMatches) {
        if (threatLevel === 1 || iocCount >= 3)
            return enums_1.Verdict.MALICIOUS;
        if (threatLevel === 2 || iocCount >= 1)
            return enums_1.Verdict.SUSPICIOUS;
        if (totalMatches > 0 && iocCount === 0)
            return enums_1.Verdict.SUSPICIOUS;
        return enums_1.Verdict.UNKNOWN;
    }
    calculateReputationScore(threatLevel, iocCount, totalMatches) {
        const levelScore = Math.max(0, (5 - threatLevel) * 20);
        const iocBonus = Math.min(iocCount * 10, 20);
        return Math.min(levelScore + iocBonus, 100);
    }
    buildUnknownResult(indicator, type) {
        const now = new Date();
        return {
            indicator,
            indicatorType: type,
            verdict: enums_1.Verdict.UNKNOWN,
            reputationScore: 0,
            confidenceScore: 0,
            source: enums_1.ThreatIntelSource.MISP,
            tags: [],
            cachedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + 1800 * 1000).toISOString(),
        };
    }
};
exports.MISPAdapter = MISPAdapter;
exports.MISPAdapter = MISPAdapter = MISPAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], MISPAdapter);
//# sourceMappingURL=misp.adapter.js.map