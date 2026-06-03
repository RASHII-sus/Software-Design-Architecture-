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
exports.ApprovalRequestEntity = void 0;
const typeorm_1 = require("typeorm");
const response_action_entity_1 = require("./response-action.entity");
let ApprovalRequestEntity = class ApprovalRequestEntity {
};
exports.ApprovalRequestEntity = ApprovalRequestEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ApprovalRequestEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'response_action_id' }),
    __metadata("design:type", String)
], ApprovalRequestEntity.prototype, "responseActionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => response_action_entity_1.ResponseActionEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'response_action_id' }),
    __metadata("design:type", response_action_entity_1.ResponseActionEntity)
], ApprovalRequestEntity.prototype, "responseAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'requested_by' }),
    __metadata("design:type", Object)
], ApprovalRequestEntity.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'PENDING' }),
    __metadata("design:type", String)
], ApprovalRequestEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ApprovalRequestEntity.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'decided_by' }),
    __metadata("design:type", Object)
], ApprovalRequestEntity.prototype, "decidedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'decided_at' }),
    __metadata("design:type", Object)
], ApprovalRequestEntity.prototype, "decidedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamptz',
        name: 'expires_at',
        default: () => "NOW() + INTERVAL '30 minutes'",
    }),
    __metadata("design:type", Date)
], ApprovalRequestEntity.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ApprovalRequestEntity.prototype, "createdAt", void 0);
exports.ApprovalRequestEntity = ApprovalRequestEntity = __decorate([
    (0, typeorm_1.Entity)('approval_requests')
], ApprovalRequestEntity);
//# sourceMappingURL=approval-request.entity.js.map