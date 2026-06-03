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
exports.ClassificationHandler = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const enrichment_handler_abstract_1 = require("./enrichment-handler.abstract");
const enums_1 = require("../../../shared/contracts/enums");
let ClassificationHandler = class ClassificationHandler extends enrichment_handler_abstract_1.EnrichmentHandler {
    constructor(config) {
        super();
        this.config = config;
        this.defaultSeverity = this.config.get('app.classificationDefaultSeverity', 'MEDIUM');
        this.rules = [
            {
                name: 'CRITICAL: Malicious indicator on critical asset',
                condition: (a) => a.enrichmentContext?.threatIntel?.verdict === enums_1.Verdict.MALICIOUS &&
                    a.enrichmentContext?.assetContext?.criticality === 'CRITICAL',
                severity: enums_1.Severity.CRITICAL,
                tags: ['malicious-indicator', 'critical-asset'],
            },
            {
                name: 'CRITICAL: Malicious indicator with admin user',
                condition: (a) => a.enrichmentContext?.threatIntel?.verdict === enums_1.Verdict.MALICIOUS &&
                    a.enrichmentContext?.userContext?.privilegeLevel === 'ADMIN',
                severity: enums_1.Severity.CRITICAL,
                tags: ['malicious-indicator', 'privileged-user'],
            },
            {
                name: 'HIGH: Malicious indicator on any asset',
                condition: (a) => a.enrichmentContext?.threatIntel?.verdict === enums_1.Verdict.MALICIOUS,
                severity: enums_1.Severity.HIGH,
                tags: ['malicious-indicator'],
            },
            {
                name: 'HIGH: Known malicious IP range with high reputation score',
                condition: (a) => (a.enrichmentContext?.geoIp?.isKnownMaliciousRange === true) &&
                    (a.enrichmentContext?.threatIntel?.reputationScore ?? 0) >= 70,
                severity: enums_1.Severity.HIGH,
                tags: ['malicious-range', 'high-reputation-score'],
            },
            {
                name: 'MEDIUM: Suspicious indicator',
                condition: (a) => a.enrichmentContext?.threatIntel?.verdict === enums_1.Verdict.SUSPICIOUS,
                severity: enums_1.Severity.MEDIUM,
                tags: ['suspicious-indicator'],
            },
            {
                name: 'MEDIUM: Known malicious range (low score)',
                condition: (a) => a.enrichmentContext?.geoIp?.isKnownMaliciousRange === true,
                severity: enums_1.Severity.MEDIUM,
                tags: ['malicious-range'],
            },
            {
                name: 'LOW: Clean indicator with no risk factors',
                condition: (a) => a.enrichmentContext?.threatIntel?.verdict === enums_1.Verdict.CLEAN &&
                    !a.enrichmentContext?.geoIp?.isKnownMaliciousRange,
                severity: enums_1.Severity.LOW,
                tags: ['clean-indicator'],
            },
        ];
    }
    getHandlerName() {
        return 'ClassificationHandler';
    }
    async doEnrich(alert) {
        const { matchedRule, classifiedSeverity, tags } = this.classifyAlert(alert);
        this.logger.log(`[ClassificationHandler] Alert ${alert.id} classified as ${classifiedSeverity} ` +
            `(rule: "${matchedRule ?? 'DEFAULT'}")`);
        const correlationId = (0, uuid_1.v4)();
        const enrichedAlert = {
            ...alert,
            severity: classifiedSeverity,
            tags: [...(alert.tags ?? []), ...tags],
            enrichmentContext: {
                ...alert.enrichmentContext,
                classifiedSeverity,
                correlationId,
            },
        };
        return {
            alert: enrichedAlert,
            enriched: true,
            handlerName: this.getHandlerName(),
            skipped: false,
            durationMs: 0,
            metadata: {
                classifiedSeverity,
                originalSeverity: alert.severity,
                matchedRule: matchedRule ?? 'DEFAULT',
                correlationId,
                appliedTags: tags,
            },
        };
    }
    classifyAlert(alert) {
        for (const rule of this.rules) {
            if (rule.condition(alert)) {
                return {
                    matchedRule: rule.name,
                    classifiedSeverity: rule.severity,
                    tags: rule.tags,
                };
            }
        }
        return {
            matchedRule: null,
            classifiedSeverity: this.defaultSeverity,
            tags: ['unclassified'],
        };
    }
};
exports.ClassificationHandler = ClassificationHandler;
exports.ClassificationHandler = ClassificationHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClassificationHandler);
//# sourceMappingURL=classification.handler.js.map