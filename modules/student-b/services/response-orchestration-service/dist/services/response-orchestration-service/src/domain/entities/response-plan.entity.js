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
exports.ResponsePlanEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../../../shared/contracts/enums");
const response_action_entity_1 = require("./response-action.entity");
let ResponsePlanEntity = class ResponsePlanEntity {
};
exports.ResponsePlanEntity = ResponsePlanEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ResponsePlanEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'incident_id' }),
    __metadata("design:type", String)
], ResponsePlanEntity.prototype, "incidentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, name: 'strategy_name' }),
    __metadata("design:type", String)
], ResponsePlanEntity.prototype, "strategyName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: enums_1.ResponsePlanStatus.PENDING,
    }),
    __metadata("design:type", String)
], ResponsePlanEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: '{}' }),
    __metadata("design:type", Object)
], ResponsePlanEntity.prototype, "context", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'created_by' }),
    __metadata("design:type", Object)
], ResponsePlanEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ResponsePlanEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ResponsePlanEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'completed_at' }),
    __metadata("design:type", Object)
], ResponsePlanEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => response_action_entity_1.ResponseActionEntity, (action) => action.responsePlan, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], ResponsePlanEntity.prototype, "actions", void 0);
exports.ResponsePlanEntity = ResponsePlanEntity = __decorate([
    (0, typeorm_1.Entity)('response_plans')
], ResponsePlanEntity);
//# sourceMappingURL=response-plan.entity.js.map