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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelHandler = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const enrichment_handler_abstract_1 = require("./enrichment-handler.abstract");
const enums_1 = require("../../../shared/contracts/enums");
let ThreatIntelHandler = class ThreatIntelHandler extends enrichment_handler_abstract_1.EnrichmentHandler {
    constructor(httpService, config) {
        super();
        this.httpService = httpService;
        this.config = config;
        this.threatIntelServiceUrl = this.config.get('app.threatIntelServiceUrl', 'http://localhost:3002');
        this.apiKey = this.config.get('app.apiKeySecret', 'dev-secret');
    }
    getHandlerName() {
        return 'ThreatIntelHandler';
    }
    async doEnrich(alert) {
        const { sourceIp, domain, fileHash } = alert.normalizedData;
        const indicator = sourceIp ?? domain ?? fileHash;
        if (!indicator) {
            this.logger.debug(`[ThreatIntelHandler] No checkable indicator in alert ${alert.id} — passing through`);
            return {
                alert,
                enriched: false,
                handlerName: this.getHandlerName(),
                skipped: true,
                skipReason: 'NO_INDICATOR',
                durationMs: 0,
            };
        }
        const indicatorType = this.resolveIndicatorType(alert.normalizedData);
        try {
            const reputationResult = await this.queryThreatIntelService(indicator, indicatorType);
            const threatIntelContext = {
                indicator,
                indicatorType,
                verdict: reputationResult.verdict,
                reputationScore: reputationResult.reputationScore,
                confidenceScore: reputationResult.confidenceScore,
                sources: [reputationResult.source],
                tags: reputationResult.tags,
            };
            const enrichedAlert = {
                ...alert,
                enrichmentContext: {
                    ...alert.enrichmentContext,
                    threatIntel: threatIntelContext,
                },
            };
            this.logger.log(`[ThreatIntelHandler] Alert ${alert.id} — ${indicatorType}:${indicator} ` +
                `verdict=${reputationResult.verdict} score=${reputationResult.reputationScore}`);
            return {
                alert: enrichedAlert,
                enriched: true,
                handlerName: this.getHandlerName(),
                skipped: false,
                durationMs: 0,
                metadata: {
                    indicator,
                    indicatorType,
                    verdict: reputationResult.verdict,
                    reputationScore: reputationResult.reputationScore,
                    isMalicious: reputationResult.verdict === enums_1.Verdict.MALICIOUS,
                },
            };
        }
        catch (err) {
            this.logger.warn(`[ThreatIntelHandler] Threat intel lookup failed for ${indicator}: ` +
                `${err.message}. Continuing pipeline without threat context.`);
            return {
                alert,
                enriched: false,
                handlerName: this.getHandlerName(),
                skipped: true,
                skipReason: 'LOOKUP_FAILED',
                durationMs: 0,
                metadata: { error: err.message },
            };
        }
    }
    async queryThreatIntelService(indicator, indicatorType) {
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.threatIntelServiceUrl}/api/v1/threat-intel/reputation`, { indicator, indicatorType }, {
            headers: { 'x-api-key': this.apiKey },
            timeout: 5000,
        }));
        return response.data;
    }
    resolveIndicatorType(normalizedData) {
        if (normalizedData.fileHash)
            return enums_1.IndicatorType.FILE_HASH;
        if (normalizedData.domain)
            return enums_1.IndicatorType.DOMAIN;
        if (normalizedData.url)
            return enums_1.IndicatorType.URL;
        return enums_1.IndicatorType.IP;
    }
};
exports.ThreatIntelHandler = ThreatIntelHandler;
exports.ThreatIntelHandler = ThreatIntelHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ThreatIntelHandler);
//# sourceMappingURL=threat-intel.handler.js.map