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
exports.AssessAndRespondDto = exports.TargetAssetDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../../../shared/contracts/enums");
class TargetAssetDto {
}
exports.TargetAssetDto = TargetAssetDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "assetId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "hostname", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "fileHash", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TargetAssetDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TargetAssetDto.prototype, "metadata", void 0);
class AssessAndRespondDto {
}
exports.AssessAndRespondDto = AssessAndRespondDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Incident ID to respond to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssessAndRespondDto.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.Severity }),
    (0, class_validator_1.IsEnum)(enums_1.Severity),
    __metadata("design:type", String)
], AssessAndRespondDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.IncidentState }),
    (0, class_validator_1.IsEnum)(enums_1.IncidentState),
    __metadata("design:type", String)
], AssessAndRespondDto.prototype, "incidentState", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] }),
    (0, class_validator_1.IsEnum)(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    __metadata("design:type", String)
], AssessAndRespondDto.prototype, "assetCriticality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TargetAssetDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TargetAssetDto),
    __metadata("design:type", Array)
], AssessAndRespondDto.prototype, "targetAssets", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssessAndRespondDto.prototype, "analystId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AssessAndRespondDto.prototype, "autoResponse", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssessAndRespondDto.prototype, "businessContext", void 0);
//# sourceMappingURL=assess-and-respond.dto.js.map