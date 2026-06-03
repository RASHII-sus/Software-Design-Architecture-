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
exports.CheckReputationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../../../shared/contracts/enums");
class CheckReputationDto {
}
exports.CheckReputationDto = CheckReputationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The indicator value to check', example: '8.8.8.8' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CheckReputationDto.prototype, "indicator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.IndicatorType, description: 'Type of the indicator' }),
    (0, class_validator_1.IsEnum)(enums_1.IndicatorType),
    __metadata("design:type", String)
], CheckReputationDto.prototype, "indicatorType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ThreatIntelSource, description: 'Specific source to query' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ThreatIntelSource),
    __metadata("design:type", String)
], CheckReputationDto.prototype, "source", void 0);
//# sourceMappingURL=check-reputation.dto.js.map