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
exports.DeduplicationHandler = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const enrichment_handler_abstract_1 = require("./enrichment-handler.abstract");
const deduplicationCache = new Map();
let DeduplicationHandler = class DeduplicationHandler extends enrichment_handler_abstract_1.EnrichmentHandler {
    constructor(config) {
        super();
        this.config = config;
        this.windowSeconds = this.config.get('app.deduplicationWindowSeconds', 300);
    }
    getHandlerName() {
        return 'DeduplicationHandler';
    }
    async doEnrich(alert) {
        const dedupKey = this.buildDedupKey(alert);
        const now = Date.now();
        const windowMs = this.windowSeconds * 1000;
        for (const [key, ts] of deduplicationCache.entries()) {
            if (now - ts > windowMs) {
                deduplicationCache.delete(key);
            }
        }
        if (deduplicationCache.has(dedupKey)) {
            const firstSeenMs = deduplicationCache.get(dedupKey);
            const ageSeconds = Math.floor((now - firstSeenMs) / 1000);
            this.logger.warn(`[DeduplicationHandler] DUPLICATE detected — alertId=${alert.id}, ` +
                `key=${dedupKey}, age=${ageSeconds}s. Stopping pipeline.`);
            return {
                alert,
                enriched: false,
                handlerName: this.getHandlerName(),
                skipped: true,
                skipReason: 'DUPLICATE',
                durationMs: 0,
                metadata: { dedupKey, firstSeenAgeSeconds: ageSeconds },
            };
        }
        deduplicationCache.set(dedupKey, now);
        this.logger.debug(`[DeduplicationHandler] Alert ${alert.id} is unique — registered key: ${dedupKey}`);
        const enrichedAlert = {
            ...alert,
            enrichmentContext: {
                ...alert.enrichmentContext,
                deduplicationKey: dedupKey,
            },
        };
        return {
            alert: enrichedAlert,
            enriched: true,
            handlerName: this.getHandlerName(),
            skipped: false,
            durationMs: 0,
            metadata: { dedupKey, cacheSize: deduplicationCache.size },
        };
    }
    buildDedupKey(alert) {
        const { sourceType, normalizedData } = alert;
        const fingerprint = [
            sourceType,
            normalizedData.eventType,
            normalizedData.sourceIp ?? '',
            normalizedData.destinationIp ?? '',
            normalizedData.userId ?? '',
            normalizedData.fileHash ?? '',
        ].join(':');
        return `dedup:${fingerprint}`;
    }
    static clearCache() {
        deduplicationCache.clear();
    }
    static getCacheSize() {
        return deduplicationCache.size;
    }
};
exports.DeduplicationHandler = DeduplicationHandler;
exports.DeduplicationHandler = DeduplicationHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DeduplicationHandler);
//# sourceMappingURL=deduplication.handler.js.map