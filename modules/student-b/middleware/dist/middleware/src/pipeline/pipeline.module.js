"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const deduplication_handler_1 = require("../handlers/deduplication.handler");
const geo_ip_handler_1 = require("../handlers/geo-ip.handler");
const threat_intel_handler_1 = require("../handlers/threat-intel.handler");
const classification_handler_1 = require("../handlers/classification.handler");
const pipeline_assembler_1 = require("./pipeline.assembler");
const pipeline_controller_1 = require("./pipeline.controller");
const pipeline_event_consumer_1 = require("../events/pipeline-event.consumer");
const pipeline_event_publisher_1 = require("../events/pipeline-event.publisher");
let PipelineModule = class PipelineModule {
};
exports.PipelineModule = PipelineModule;
exports.PipelineModule = PipelineModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, axios_1.HttpModule],
        controllers: [pipeline_controller_1.PipelineController],
        providers: [
            deduplication_handler_1.DeduplicationHandler,
            geo_ip_handler_1.GeoIPHandler,
            threat_intel_handler_1.ThreatIntelHandler,
            classification_handler_1.ClassificationHandler,
            pipeline_assembler_1.PipelineAssembler,
            pipeline_event_consumer_1.PipelineEventConsumer,
            pipeline_event_publisher_1.PipelineEventPublisher,
        ],
        exports: [pipeline_assembler_1.PipelineAssembler],
    })
], PipelineModule);
//# sourceMappingURL=pipeline.module.js.map