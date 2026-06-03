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
exports.BulkCheckReputationDto = exports.IndicatorItem = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../../../shared/contracts/enums");
class IndicatorItem {
}
exports.IndicatorItem = IndicatorItem;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], IndicatorItem.prototype, "indicator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.IndicatorType }),
    (0, class_validator_1.IsEnum)(enums_1.IndicatorType),
    __metadata("design:type", String)
], IndicatorItem.prototype, "indicatorType", void 0);
class BulkCheckReputationDto {
}
exports.BulkCheckReputationDto = BulkCheckReputationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [IndicatorItem], maxItems: 50 }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IndicatorItem),
    __metadata("design:type", Array)
], BulkCheckReputationDto.prototype, "indicators", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ThreatIntelSource }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ThreatIntelSource),
    __metadata("design:type", String)
], BulkCheckReputationDto.prototype, "source", void 0);
//# sourceMappingURL=bulk-check-reputation.dto.js.map