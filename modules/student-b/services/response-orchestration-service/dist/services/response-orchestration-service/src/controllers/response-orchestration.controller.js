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
var ResponseOrchestrationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseOrchestrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const incident_response_facade_1 = require("../services/facade/incident-response.facade");
const approval_service_1 = require("../services/approval.service");
const assess_and_respond_dto_1 = require("../dto/assess-and-respond.dto");
const metrics_decorator_1 = require("../services/decorator/metrics.decorator");
const enums_1 = require("../../../../shared/contracts/enums");
let ResponseOrchestrationController = ResponseOrchestrationController_1 = class ResponseOrchestrationController {
    constructor(facade, approvalService) {
        this.facade = facade;
        this.approvalService = approvalService;
        this.logger = new common_1.Logger(ResponseOrchestrationController_1.name);
    }
    async assessAndRespond(dto) {
        this.logger.log(`POST /response/assess — incidentId=${dto.incidentId}`);
        const context = {
            incidentId: dto.incidentId,
            incidentState: dto.incidentState ?? enums_1.IncidentState.CONTAINMENT,
            severity: dto.severity,
            assetCriticality: dto.assetCriticality,
            analystId: dto.analystId,
            autoResponse: dto.autoResponse ?? true,
            businessContext: dto.businessContext,
        };
        return this.facade.assessAndRespond(dto.incidentId, context, dto.targetAssets);
    }
    async getResponseHistory(incidentId) {
        return this.facade.getResponseHistory(incidentId);
    }
    async rollbackPlan(planId) {
        this.logger.log(`POST /response/plans/${planId}/rollback`);
        return this.facade.rollbackPlan(planId);
    }
    async getPendingApprovals() {
        return this.approvalService.getPendingApprovals();
    }
    async approveAction(approvalId, body) {
        return this.approvalService.approve(approvalId, body.decidedBy, body.reason);
    }
    async rejectAction(approvalId, body) {
        return this.approvalService.reject(approvalId, body.decidedBy, body.reason);
    }
    async getMetrics() {
        return metrics_decorator_1.MetricsDecorator.getMetrics();
    }
    getStrategies() {
        return {
            strategies: [
                {
                    name: 'AggressiveContainmentStrategy',
                    description: 'CRITICAL severity on HIGH/CRITICAL assets. Isolates, blocks, disables.',
                    useCase: 'severity=CRITICAL, assetCriticality=CRITICAL|HIGH',
                },
                {
                    name: 'BalancedResponseStrategy',
                    description: 'HIGH severity. Blocks IPs and quarantines files. Preserves endpoint.',
                    useCase: 'severity=HIGH, assetCriticality=MEDIUM|HIGH',
                },
                {
                    name: 'ConservativeStrategy',
                    description: 'MEDIUM severity. Only network block. Escalates for human decision.',
                    useCase: 'severity=MEDIUM',
                },
                {
                    name: 'WatchAndWaitStrategy',
                    description: 'LOW/INFORMATIONAL. No automated actions. Escalates to analyst.',
                    useCase: 'severity=LOW|INFORMATIONAL',
                },
            ],
        };
    }
};
exports.ResponseOrchestrationController = ResponseOrchestrationController;
__decorate([
    (0, common_1.Post)('assess'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Assess incident and execute automated response plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Response plan executed and outcomes returned' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assess_and_respond_dto_1.AssessAndRespondDto]),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "assessAndRespond", null);
__decorate([
    (0, common_1.Get)('incidents/:incidentId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get response plan history for an incident' }),
    __param(0, (0, common_1.Param)('incidentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "getResponseHistory", null);
__decorate([
    (0, common_1.Post)('plans/:planId/rollback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Rollback all actions in a response plan' }),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "rollbackPlan", null);
__decorate([
    (0, common_1.Get)('approvals/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pending approval requests' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)('approvals/:approvalId/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a pending response action' }),
    __param(0, (0, common_1.Param)('approvalId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "approveAction", null);
__decorate([
    (0, common_1.Post)('approvals/:approvalId/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a pending response action' }),
    __param(0, (0, common_1.Param)('approvalId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "rejectAction", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get action execution metrics from MetricsDecorator' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResponseOrchestrationController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('strategies'),
    (0, swagger_1.ApiOperation)({ summary: 'List all available response strategies' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ResponseOrchestrationController.prototype, "getStrategies", null);
exports.ResponseOrchestrationController = ResponseOrchestrationController = ResponseOrchestrationController_1 = __decorate([
    (0, swagger_1.ApiTags)('response-orchestration'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.Controller)('response'),
    __metadata("design:paramtypes", [incident_response_facade_1.IncidentResponseFacade,
        approval_service_1.ApprovalService])
], ResponseOrchestrationController);
//# sourceMappingURL=response-orchestration.controller.js.map