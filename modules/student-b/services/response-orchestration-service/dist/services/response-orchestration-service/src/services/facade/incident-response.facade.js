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
var IncidentResponseFacade_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentResponseFacade = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const response_strategy_selector_1 = require("../strategy/response-strategy.selector");
const response_action_factory_1 = require("../factory/response-action.factory");
const response_plan_repository_1 = require("../../domain/repositories/response-plan.repository");
const response_action_repository_1 = require("../../domain/repositories/response-action.repository");
const response_orchestration_event_publisher_1 = require("../../events/response-orchestration-event.publisher");
const audit_log_decorator_1 = require("../decorator/audit-log.decorator");
const approval_gate_decorator_1 = require("../decorator/approval-gate.decorator");
const metrics_decorator_1 = require("../decorator/metrics.decorator");
const rollback_decorator_1 = require("../decorator/rollback.decorator");
const enums_1 = require("../../../../../shared/contracts/enums");
let IncidentResponseFacade = IncidentResponseFacade_1 = class IncidentResponseFacade {
    constructor(strategySelector, actionFactory, planRepository, actionRepository, eventPublisher, config) {
        this.strategySelector = strategySelector;
        this.actionFactory = actionFactory;
        this.planRepository = planRepository;
        this.actionRepository = actionRepository;
        this.eventPublisher = eventPublisher;
        this.config = config;
        this.logger = new common_1.Logger(IncidentResponseFacade_1.name);
        this.requireApprovalForCritical = this.config.get('app.requireApprovalForCritical', true);
        this.autoRollbackOnFailure = this.config.get('app.autoRollbackOnFailure', true);
    }
    async assessAndRespond(incidentId, context, targetAssets) {
        this.logger.log(`[IncidentResponseFacade] assessAndRespond — incidentId=${incidentId}, ` +
            `severity=${context.severity}, criticality=${context.assetCriticality}`);
        const strategy = this.strategySelector.selectStrategy(context);
        const plan = strategy.determineActions(context);
        this.logger.log(`[IncidentResponseFacade] Strategy selected: ${plan.strategyName} ` +
            `— actions: [${plan.actionTypes.join(', ')}]`);
        const planEntity = await this.planRepository.create({
            incidentId,
            strategyName: plan.strategyName,
            status: enums_1.ResponsePlanStatus.IN_PROGRESS,
            context: { severity: context.severity, criticality: context.assetCriticality },
            createdBy: context.analystId ?? null,
        });
        const outcomes = [];
        const rollbackDecorators = [];
        const pendingApprovals = [];
        for (const actionType of plan.actionTypes) {
            const target = this.selectTarget(actionType, targetAssets);
            const rawAction = this.actionFactory.createAction(actionType);
            const metricsDecorated = new metrics_decorator_1.MetricsDecorator(rawAction);
            const rollbackDecorated = new rollback_decorator_1.RollbackDecorator(metricsDecorated, this.autoRollbackOnFailure && plan.autoRollbackOnFailure);
            const needsApproval = plan.requiresApproval ||
                (this.requireApprovalForCritical && context.severity === enums_1.Severity.CRITICAL);
            const approvalDecorated = new approval_gate_decorator_1.ApprovalGateDecorator(rollbackDecorated, needsApproval);
            const auditDecorated = new audit_log_decorator_1.AuditLogDecorator(approvalDecorated);
            rollbackDecorators.push(rollbackDecorated);
            const actionEntity = await this.actionRepository.create({
                responsePlanId: planEntity.id,
                actionType,
                targetAsset: target,
                status: enums_1.ResponseActionStatus.PENDING,
                requiresApproval: needsApproval,
            });
            await this.actionRepository.markExecuting(actionEntity.id);
            const outcome = await auditDecorated.execute(target);
            outcomes.push(outcome);
            await this.actionRepository.markCompleted(actionEntity.id, outcome.success, outcome, outcome.rollbackContext);
            if (outcome.status === enums_1.ResponseActionStatus.PENDING) {
                pendingApprovals.push(actionType);
            }
            if (!outcome.success && this.autoRollbackOnFailure && plan.autoRollbackOnFailure) {
                this.logger.warn(`[IncidentResponseFacade] Action ${actionType} FAILED — triggering rollback of previous actions`);
                await this.rollbackPreviousActions(planEntity.id, rollbackDecorators.slice(0, -1));
                await this.planRepository.updateStatus(planEntity.id, enums_1.ResponsePlanStatus.FAILED, new Date());
                await this.eventPublisher.publishResponseActionExecuted(incidentId, planEntity.id, outcomes, plan.strategyName);
                return {
                    responsePlanId: planEntity.id,
                    incidentId,
                    strategyUsed: plan.strategyName,
                    rationale: plan.rationale,
                    actions: outcomes,
                    allSuccessful: false,
                    requiresEscalation: true,
                    requiresApproval: false,
                    pendingApprovals: [],
                };
            }
        }
        const allSuccessful = outcomes.every((o) => o.success || o.status === enums_1.ResponseActionStatus.PENDING);
        const requiresEscalation = outcomes.some((o) => o.actionType === enums_1.ResponseActionType.ESCALATE && o.success);
        await this.planRepository.updateStatus(planEntity.id, allSuccessful ? enums_1.ResponsePlanStatus.COMPLETED : enums_1.ResponsePlanStatus.FAILED, new Date());
        await this.eventPublisher.publishResponseActionExecuted(incidentId, planEntity.id, outcomes, plan.strategyName);
        this.logger.log(`[IncidentResponseFacade] Plan ${planEntity.id} completed — ` +
            `allSuccessful=${allSuccessful}, pendingApprovals=${pendingApprovals.length}`);
        return {
            responsePlanId: planEntity.id,
            incidentId,
            strategyUsed: plan.strategyName,
            rationale: plan.rationale,
            actions: outcomes,
            allSuccessful,
            requiresEscalation,
            requiresApproval: pendingApprovals.length > 0,
            pendingApprovals,
        };
    }
    async rollbackPlan(responsePlanId) {
        this.logger.log(`[IncidentResponseFacade] Manual rollback requested for plan ${responsePlanId}`);
        const plan = await this.planRepository.findById(responsePlanId);
        if (!plan) {
            throw new common_1.NotFoundException(`Response plan ${responsePlanId} not found`);
        }
        const rollbackOutcomes = [];
        const reversibleActions = plan.actions.filter((a) => a.status === enums_1.ResponseActionStatus.SUCCESS &&
            a.rollbackContext !== null);
        for (const actionRecord of reversibleActions) {
            const action = this.actionFactory.createAction(actionRecord.actionType);
            const rollbackCtx = actionRecord.rollbackContext;
            const outcome = await action.rollback(rollbackCtx);
            rollbackOutcomes.push(outcome);
            await this.actionRepository.updateStatus(actionRecord.id, enums_1.ResponseActionStatus.ROLLED_BACK);
        }
        await this.planRepository.updateStatus(responsePlanId, enums_1.ResponsePlanStatus.ROLLED_BACK, new Date());
        return {
            responsePlanId,
            rolledBack: rollbackOutcomes,
            allRolledBack: rollbackOutcomes.every((o) => o.success),
        };
    }
    async getResponseHistory(incidentId) {
        return this.planRepository.findByIncidentId(incidentId);
    }
    selectTarget(actionType, targets) {
        if (targets.length === 0) {
            return {};
        }
        switch (actionType) {
            case enums_1.ResponseActionType.BLOCK_IP:
                return targets.find((t) => t.ipAddress || t.domain) ?? targets[0];
            case enums_1.ResponseActionType.ISOLATE_ENDPOINT:
                return targets.find((t) => t.hostname || t.assetId) ?? targets[0];
            case enums_1.ResponseActionType.DISABLE_USER:
                return targets.find((t) => t.userId) ?? targets[0];
            case enums_1.ResponseActionType.QUARANTINE_FILE:
                return targets.find((t) => t.filePath || t.fileHash) ?? targets[0];
            default:
                return targets[0];
        }
    }
    async rollbackPreviousActions(planId, decorators) {
        for (const decorator of [...decorators].reverse()) {
            const ctx = decorator.getCapturedRollbackContext();
            if (ctx && decorator.isReversible()) {
                try {
                    await decorator.rollback(ctx);
                }
                catch (err) {
                    this.logger.error(`[IncidentResponseFacade] Rollback failed for ${decorator.getType()}: ` +
                        err.message);
                }
            }
        }
    }
};
exports.IncidentResponseFacade = IncidentResponseFacade;
exports.IncidentResponseFacade = IncidentResponseFacade = IncidentResponseFacade_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [response_strategy_selector_1.ResponseStrategySelector,
        response_action_factory_1.ResponseActionFactory,
        response_plan_repository_1.ResponsePlanRepository,
        response_action_repository_1.ResponseActionRepository,
        response_orchestration_event_publisher_1.ResponseOrchestrationEventPublisher,
        config_1.ConfigService])
], IncidentResponseFacade);
//# sourceMappingURL=incident-response.facade.js.map