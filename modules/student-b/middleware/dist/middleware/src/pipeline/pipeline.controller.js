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
var PipelineController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const pipeline_assembler_1 = require("./pipeline.assembler");
const deduplication_handler_1 = require("../handlers/deduplication.handler");
class ProcessAlertDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'Canonical alert object to process through the pipeline' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], ProcessAlertDto.prototype, "alert", void 0);
let PipelineController = PipelineController_1 = class PipelineController {
    constructor(assembler) {
        this.assembler = assembler;
        this.logger = new common_1.Logger(PipelineController_1.name);
    }
    async processAlert(dto) {
        this.logger.log(`POST /pipeline/process — alertId=${dto.alert.id}`);
        return this.assembler.process(dto.alert);
    }
    getChain() {
        return {
            pattern: 'Chain of Responsibility',
            handlers: this.assembler.getChainDescription(),
        };
    }
    getDedupStats() {
        return {
            cacheSize: deduplication_handler_1.DeduplicationHandler.getCacheSize(),
        };
    }
};
exports.PipelineController = PipelineController;
__decorate([
    (0, common_1.Post)('process'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Process a canonical alert through the full enrichment pipeline' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pipeline result with all stage outcomes' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ProcessAlertDto]),
    __metadata("design:returntype", Promise)
], PipelineController.prototype, "processAlert", null);
__decorate([
    (0, common_1.Get)('chain'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the configured handler chain description' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineController.prototype, "getChain", null);
__decorate([
    (0, common_1.Get)('dedup/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get deduplication cache stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineController.prototype, "getDedupStats", null);
exports.PipelineController = PipelineController = PipelineController_1 = __decorate([
    (0, swagger_1.ApiTags)('pipeline'),
    (0, common_1.Controller)('pipeline'),
    __metadata("design:paramtypes", [pipeline_assembler_1.PipelineAssembler])
], PipelineController);
//# sourceMappingURL=pipeline.controller.js.map