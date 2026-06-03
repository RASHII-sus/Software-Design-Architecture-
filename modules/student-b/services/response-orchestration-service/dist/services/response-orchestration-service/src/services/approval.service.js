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
var ApprovalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const approval_request_entity_1 = require("../domain/entities/approval-request.entity");
const response_action_repository_1 = require("../domain/repositories/response-action.repository");
const enums_1 = require("../../../../shared/contracts/enums");
let ApprovalService = ApprovalService_1 = class ApprovalService {
    constructor(approvalRepo, actionRepository) {
        this.approvalRepo = approvalRepo;
        this.actionRepository = actionRepository;
        this.logger = new common_1.Logger(ApprovalService_1.name);
    }
    async requestApproval(responseActionId, requestedBy) {
        const existing = await this.approvalRepo.findOne({ where: { responseActionId } });
        if (existing && existing.status === 'PENDING') {
            return existing;
        }
        const entity = this.approvalRepo.create({
            responseActionId,
            requestedBy: requestedBy ?? null,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
        return this.approvalRepo.save(entity);
    }
    async approve(approvalId, decidedBy, reason) {
        const approval = await this.approvalRepo.findOne({ where: { id: approvalId } });
        if (!approval) {
            throw new common_1.NotFoundException(`Approval request ${approvalId} not found`);
        }
        approval.status = 'APPROVED';
        approval.decidedBy = decidedBy;
        approval.decidedAt = new Date();
        approval.reason = reason ?? null;
        const saved = await this.approvalRepo.save(approval);
        await this.actionRepository.updateStatus(approval.responseActionId, enums_1.ResponseActionStatus.APPROVED, {
            approvedBy: decidedBy,
            approvedAt: new Date(),
        });
        this.logger.log(`[ApprovalService] Approved action ${approval.responseActionId} by ${decidedBy}`);
        return saved;
    }
    async reject(approvalId, decidedBy, reason) {
        const approval = await this.approvalRepo.findOne({ where: { id: approvalId } });
        if (!approval) {
            throw new common_1.NotFoundException(`Approval request ${approvalId} not found`);
        }
        approval.status = 'REJECTED';
        approval.decidedBy = decidedBy;
        approval.decidedAt = new Date();
        approval.reason = reason;
        return this.approvalRepo.save(approval);
    }
    async getPendingApprovals() {
        return this.approvalRepo.find({
            where: { status: 'PENDING' },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.ApprovalService = ApprovalService;
exports.ApprovalService = ApprovalService = ApprovalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequestEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        response_action_repository_1.ResponseActionRepository])
], ApprovalService);
//# sourceMappingURL=approval.service.js.map