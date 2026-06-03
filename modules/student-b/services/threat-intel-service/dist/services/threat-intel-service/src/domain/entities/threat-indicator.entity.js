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
exports.ThreatIndicatorEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../../../shared/contracts/enums");
let ThreatIndicatorEntity = class ThreatIndicatorEntity {
};
exports.ThreatIndicatorEntity = ThreatIndicatorEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ThreatIndicatorEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], ThreatIndicatorEntity.prototype, "indicator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'indicator_type' }),
    __metadata("design:type", String)
], ThreatIndicatorEntity.prototype, "indicatorType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ThreatIndicatorEntity.prototype, "verdict", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'confidence' }),
    __metadata("design:type", Number)
], ThreatIndicatorEntity.prototype, "confidenceScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'reputation_score' }),
    __metadata("design:type", Number)
], ThreatIndicatorEntity.prototype, "reputationScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], ThreatIndicatorEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'raw_response' }),
    __metadata("design:type", Object)
], ThreatIndicatorEntity.prototype, "rawResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], ThreatIndicatorEntity.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'first_seen', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], ThreatIndicatorEntity.prototype, "firstSeen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'last_seen', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], ThreatIndicatorEntity.prototype, "lastSeen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'expires_at', nullable: true }),
    __metadata("design:type", Object)
], ThreatIndicatorEntity.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ThreatIndicatorEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ThreatIndicatorEntity.prototype, "updatedAt", void 0);
exports.ThreatIndicatorEntity = ThreatIndicatorEntity = __decorate([
    (0, typeorm_1.Entity)('threat_indicators'),
    (0, typeorm_1.Index)(['indicator']),
    (0, typeorm_1.Index)(['indicatorType', 'verdict'])
], ThreatIndicatorEntity);
//# sourceMappingURL=threat-indicator.entity.js.map