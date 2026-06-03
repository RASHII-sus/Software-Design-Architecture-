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
exports.ResponseActionEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../../../shared/contracts/enums");
const response_plan_entity_1 = require("./response-plan.entity");
let ResponseActionEntity = class ResponseActionEntity {
};
exports.ResponseActionEntity = ResponseActionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ResponseActionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'response_plan_id' }),
    __metadata("design:type", String)
], ResponseActionEntity.prototype, "responsePlanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => response_plan_entity_1.ResponsePlanEntity, (plan) => plan.actions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'response_plan_id' }),
    __metadata("design:type", response_plan_entity_1.ResponsePlanEntity)
], ResponseActionEntity.prototype, "responsePlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'action_type' }),
    __metadata("design:type", String)
], ResponseActionEntity.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'target_asset' }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "targetAsset", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: enums_1.ResponseActionStatus.PENDING,
    }),
    __metadata("design:type", String)
], ResponseActionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'rollback_context' }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "rollbackContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'requires_approval' }),
    __metadata("design:type", Boolean)
], ResponseActionEntity.prototype, "requiresApproval", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'approved_by' }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'approved_at' }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'executed_at' }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "executedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'completed_at' }),
    __metadata("design:type", Object)
], ResponseActionEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ResponseActionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ResponseActionEntity.prototype, "updatedAt", void 0);
exports.ResponseActionEntity = ResponseActionEntity = __decorate([
    (0, typeorm_1.Entity)('response_actions')
], ResponseActionEntity);
//# sourceMappingURL=response-action.entity.js.map