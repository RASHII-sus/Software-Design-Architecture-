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
var ThreatIntelController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const threat_intel_service_1 = require("../services/threat-intel.service");
const check_reputation_dto_1 = require("../dto/check-reputation.dto");
const bulk_check_reputation_dto_1 = require("../dto/bulk-check-reputation.dto");
const enums_1 = require("../../../../shared/contracts/enums");
let ThreatIntelController = ThreatIntelController_1 = class ThreatIntelController {
    constructor(threatIntelService) {
        this.threatIntelService = threatIntelService;
        this.logger = new common_1.Logger(ThreatIntelController_1.name);
    }
    async checkReputation(dto) {
        this.logger.log(`POST /threat-intel/reputation — ${dto.indicatorType}:${dto.indicator}`);
        return this.threatIntelService.checkReputation(dto);
    }
    async bulkCheckReputation(dto) {
        this.logger.log(`POST /threat-intel/reputation/bulk — ${dto.indicators.length} indicators`);
        return this.threatIntelService.bulkCheckReputation(dto);
    }
    async getIndicatorHistory(indicator, source) {
        return this.threatIntelService.getIndicatorHistory(indicator, source);
    }
    async getMaliciousIndicators(limit) {
        return this.threatIntelService.getMaliciousIndicators(limit ? Number(limit) : 50);
    }
    async getStats() {
        return this.threatIntelService.getStats();
    }
    async invalidateCache(indicator, indicatorType) {
        await this.threatIntelService.invalidateCache(indicator, indicatorType);
    }
};
exports.ThreatIntelController = ThreatIntelController;
__decorate([
    (0, common_1.Post)('reputation'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Check reputation of a single indicator' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reputation result returned' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Rate limit exceeded' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_reputation_dto_1.CheckReputationDto]),
    __metadata("design:returntype", Promise)
], ThreatIntelController.prototype, "checkReputation", null);
__decorate([
    (0, common_1.Post)('reputation/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Check reputation of multiple indicators (max 50)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of reputation results' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_check_reputation_dto_1.BulkCheckReputationDto]),
    __metadata("design:returntype", Promise)
], ThreatIntelController.prototype, "bulkCheckReputation", null);
__decorate([
    (0, common_1.Get)('indicators/:indicator/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stored history for an indicator' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Historical reputation data' }),
    __param(0, (0, common_1.Param)('indicator')),
    __param(1, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ThreatIntelController.prototype, "getIndicatorHistory", null);
__decorate([
    (0, common_1.Get)('indicators/malicious'),
    (0, swagger_1.ApiOperation)({ summary: 'Get known malicious indicators' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ThreatIntelController.prototype, "getMaliciousIndicators", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cache and verdict statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ThreatIntelController.prototype, "getStats", null);
__decorate([
    (0, common_1.Delete)('cache/:indicatorType/:indicator'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate cache for a specific indicator' }),
    __param(0, (0, common_1.Param)('indicator')),
    __param(1, (0, common_1.Param)('indicatorType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ThreatIntelController.prototype, "invalidateCache", null);
exports.ThreatIntelController = ThreatIntelController = ThreatIntelController_1 = __decorate([
    (0, swagger_1.ApiTags)('threat-intel'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.Controller)('threat-intel'),
    __metadata("design:paramtypes", [threat_intel_service_1.ThreatIntelService])
], ThreatIntelController);
//# sourceMappingURL=threat-intel.controller.js.map