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
var PipelineAssembler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineAssembler = void 0;
const common_1 = require("@nestjs/common");
const deduplication_handler_1 = require("../handlers/deduplication.handler");
const geo_ip_handler_1 = require("../handlers/geo-ip.handler");
const threat_intel_handler_1 = require("../handlers/threat-intel.handler");
const classification_handler_1 = require("../handlers/classification.handler");
let PipelineAssembler = PipelineAssembler_1 = class PipelineAssembler {
    constructor(deduplicationHandler, geoIPHandler, threatIntelHandler, classificationHandler) {
        this.deduplicationHandler = deduplicationHandler;
        this.geoIPHandler = geoIPHandler;
        this.threatIntelHandler = threatIntelHandler;
        this.classificationHandler = classificationHandler;
        this.logger = new common_1.Logger(PipelineAssembler_1.name);
        this.deduplicationHandler
            .setNext(this.geoIPHandler)
            .setNext(this.threatIntelHandler)
            .setNext(this.classificationHandler);
        this.head = this.deduplicationHandler;
        this.logger.log('[PipelineAssembler] Chain assembled: ' +
            'DeduplicationHandler → GeoIPHandler → ThreatIntelHandler → ClassificationHandler');
    }
    async process(alert) {
        const start = Date.now();
        this.logger.log(`[PipelineAssembler] Processing alert ${alert.id} (${alert.sourceType}:${alert.normalizedData.eventType})`);
        const stageResults = [];
        let processedAlert;
        let stoppedAt;
        let stopReason;
        try {
            processedAlert = await this.head.handle(alert, stageResults);
        }
        catch (err) {
            this.logger.error(`[PipelineAssembler] Unhandled error in pipeline for alert ${alert.id}: ` +
                err.message, err.stack);
            throw err;
        }
        const stoppedStage = stageResults.find((r) => r.skipped && r.skipReason === 'DUPLICATE');
        if (stoppedStage) {
            stoppedAt = stoppedStage.handlerName;
            stopReason = stoppedStage.skipReason;
        }
        const totalDurationMs = Date.now() - start;
        this.logger.log(`[PipelineAssembler] Alert ${alert.id} processed in ${totalDurationMs}ms — ` +
            `stages completed: ${stageResults.filter((r) => r.enriched).length}/${stageResults.length}`);
        return {
            originalAlertId: alert.id,
            processedAlert,
            stageResults,
            totalDurationMs,
            completed: !stoppedAt,
            stoppedAt,
            stopReason,
        };
    }
    getChainDescription() {
        return [
            'DeduplicationHandler (H1)',
            'GeoIPHandler (H2)',
            'ThreatIntelHandler (H3)',
            'ClassificationHandler (H4)',
        ];
    }
};
exports.PipelineAssembler = PipelineAssembler;
exports.PipelineAssembler = PipelineAssembler = PipelineAssembler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [deduplication_handler_1.DeduplicationHandler,
        geo_ip_handler_1.GeoIPHandler,
        threat_intel_handler_1.ThreatIntelHandler,
        classification_handler_1.ClassificationHandler])
], PipelineAssembler);
//# sourceMappingURL=pipeline.assembler.js.map