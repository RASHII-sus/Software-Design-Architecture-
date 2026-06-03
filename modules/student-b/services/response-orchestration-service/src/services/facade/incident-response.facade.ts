// services/response-orchestration-service/src/services/facade/incident-response.facade.ts
// PATTERN: Facade
// Single entry point for the entire response orchestration subsystem.
// Hides the complexity of: strategy selection → factory creation → decorator
// stacking → sequential execution → state persistence → event publishing.
// Client code (Controller or RabbitMQ consumer) calls one method.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ResponseStrategySelector } from '../strategy/response-strategy.selector';
import { ResponseActionFactory } from '../factory/response-action.factory';
import { ResponsePlanRepository } from '../../domain/repositories/response-plan.repository';
import { ResponseActionRepository } from '../../domain/repositories/response-action.repository';
import { ResponseOrchestrationEventPublisher } from '../../events/response-orchestration-event.publisher';

// Decorators — PATTERN: Decorator
import { AuditLogDecorator } from '../decorator/audit-log.decorator';
import { ApprovalGateDecorator } from '../decorator/approval-gate.decorator';
import { MetricsDecorator } from '../decorator/metrics.decorator';
import { RollbackDecorator } from '../decorator/rollback.decorator';

import {
  ResponseActionType,
  ResponseActionStatus,
  ResponsePlanStatus,
  Severity,
} from '../../../../../shared/contracts/enums';
import {
  ResponseContext,
  TargetAsset,
  ActionOutcome,
} from '../../../../../shared/contracts/interfaces';

export interface AssessAndRespondResult {
  responsePlanId: string;
  incidentId: string;
  strategyUsed: string;
  rationale: string;
  actions: ActionOutcome[];
  allSuccessful: boolean;
  requiresEscalation: boolean;
  requiresApproval: boolean;
  pendingApprovals: ResponseActionType[];
}

export interface RollbackResult {
  responsePlanId: string;
  rolledBack: ActionOutcome[];
  allRolledBack: boolean;
}

@Injectable()
export class IncidentResponseFacade {
  private readonly logger = new Logger(IncidentResponseFacade.name);
  private readonly requireApprovalForCritical: boolean;
  private readonly autoRollbackOnFailure: boolean;

  constructor(
    private readonly strategySelector: ResponseStrategySelector,
    private readonly actionFactory: ResponseActionFactory,
    private readonly planRepository: ResponsePlanRepository,
    private readonly actionRepository: ResponseActionRepository,
    private readonly eventPublisher: ResponseOrchestrationEventPublisher,
    private readonly config: ConfigService,
  ) {
    this.requireApprovalForCritical = this.config.get<boolean>(
      'app.requireApprovalForCritical',
      true,
    );
    this.autoRollbackOnFailure = this.config.get<boolean>('app.autoRollbackOnFailure', true);
  }

  // PATTERN: Facade — single method that coordinates all subsystems
  async assessAndRespond(
    incidentId: string,
    context: ResponseContext,
    targetAssets: TargetAsset[],
  ): Promise<AssessAndRespondResult> {
    this.logger.log(
      `[IncidentResponseFacade] assessAndRespond — incidentId=${incidentId}, ` +
        `severity=${context.severity}, criticality=${context.assetCriticality}`,
    );

    // ① Select strategy — PATTERN: Strategy
    const strategy = this.strategySelector.selectStrategy(context);
    const plan = strategy.determineActions(context);

    this.logger.log(
      `[IncidentResponseFacade] Strategy selected: ${plan.strategyName} ` +
        `— actions: [${plan.actionTypes.join(', ')}]`,
    );

    // ② Persist response plan to PostgreSQL
    const planEntity = await this.planRepository.create({
      incidentId,
      strategyName: plan.strategyName,
      status: ResponsePlanStatus.IN_PROGRESS,
      context: { severity: context.severity, criticality: context.assetCriticality },
      createdBy: context.analystId ?? null,
    });

    const outcomes: ActionOutcome[] = [];
    const rollbackDecorators: RollbackDecorator[] = [];
    const pendingApprovals: ResponseActionType[] = [];

    // ③ For each action type in the plan, create + decorate + execute
    for (const actionType of plan.actionTypes) {
      const target = this.selectTarget(actionType, targetAssets);

      // ③a Factory creates the raw action — PATTERN: Factory Method
      const rawAction = this.actionFactory.createAction(actionType);

      // ③b Stack decorators — PATTERN: Decorator
      // Order: AuditLog wraps ApprovalGate wraps Rollback wraps MetricsDecorator wraps raw
      const metricsDecorated = new MetricsDecorator(rawAction);
      const rollbackDecorated = new RollbackDecorator(
        metricsDecorated,
        this.autoRollbackOnFailure && plan.autoRollbackOnFailure,
      );
      const needsApproval =
        plan.requiresApproval ||
        (this.requireApprovalForCritical && context.severity === Severity.CRITICAL);
      const approvalDecorated = new ApprovalGateDecorator(rollbackDecorated, needsApproval);
      const auditDecorated = new AuditLogDecorator(approvalDecorated);

      rollbackDecorators.push(rollbackDecorated);

      // ③c Persist action record before execution
      const actionEntity = await this.actionRepository.create({
        responsePlanId: planEntity.id,
        actionType,
        targetAsset: target as Record<string, unknown>,
        status: ResponseActionStatus.PENDING,
        requiresApproval: needsApproval,
      });

      // ③d Execute the decorated action chain
      await this.actionRepository.markExecuting(actionEntity.id);
      const outcome = await auditDecorated.execute(target);
      outcomes.push(outcome);

      // ③e Persist outcome
      await this.actionRepository.markCompleted(
        actionEntity.id,
        outcome.success,
        outcome as unknown as Record<string, unknown>,
        outcome.rollbackContext as Record<string, unknown> | undefined,
      );

      if (outcome.status === ResponseActionStatus.PENDING) {
        pendingApprovals.push(actionType);
      }

      // ③f If action failed and auto-rollback is on, rollback all previous successes
      if (!outcome.success && this.autoRollbackOnFailure && plan.autoRollbackOnFailure) {
        this.logger.warn(
          `[IncidentResponseFacade] Action ${actionType} FAILED — triggering rollback of previous actions`,
        );
        await this.rollbackPreviousActions(planEntity.id, rollbackDecorators.slice(0, -1));
        await this.planRepository.updateStatus(
          planEntity.id,
          ResponsePlanStatus.FAILED,
          new Date(),
        );

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

    const allSuccessful = outcomes.every(
      (o) => o.success || o.status === ResponseActionStatus.PENDING,
    );
    const requiresEscalation = outcomes.some(
      (o) => o.actionType === ResponseActionType.ESCALATE && o.success,
    );

    // ④ Update plan status
    await this.planRepository.updateStatus(
      planEntity.id,
      allSuccessful ? ResponsePlanStatus.COMPLETED : ResponsePlanStatus.FAILED,
      new Date(),
    );

    // ⑤ Publish ResponseActionExecuted domain event — PATTERN: Observer (via RabbitMQ)
    await this.eventPublisher.publishResponseActionExecuted(
      incidentId,
      planEntity.id,
      outcomes,
      plan.strategyName,
    );

    this.logger.log(
      `[IncidentResponseFacade] Plan ${planEntity.id} completed — ` +
        `allSuccessful=${allSuccessful}, pendingApprovals=${pendingApprovals.length}`,
    );

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

  async rollbackPlan(responsePlanId: string): Promise<RollbackResult> {
    this.logger.log(`[IncidentResponseFacade] Manual rollback requested for plan ${responsePlanId}`);

    const plan = await this.planRepository.findById(responsePlanId);
    if (!plan) {
      throw new NotFoundException(`Response plan ${responsePlanId} not found`);
    }

    const rollbackOutcomes: ActionOutcome[] = [];
    const reversibleActions = plan.actions.filter(
      (a) =>
        a.status === ResponseActionStatus.SUCCESS &&
        a.rollbackContext !== null,
    );

    for (const actionRecord of reversibleActions) {
      const action = this.actionFactory.createAction(actionRecord.actionType);
      const rollbackCtx = actionRecord.rollbackContext as unknown as import('../../../../../shared/contracts/interfaces').RollbackContext;
      const outcome = await action.rollback(rollbackCtx);
      rollbackOutcomes.push(outcome);

      await this.actionRepository.updateStatus(actionRecord.id, ResponseActionStatus.ROLLED_BACK);
    }

    await this.planRepository.updateStatus(
      responsePlanId,
      ResponsePlanStatus.ROLLED_BACK,
      new Date(),
    );

    return {
      responsePlanId,
      rolledBack: rollbackOutcomes,
      allRolledBack: rollbackOutcomes.every((o) => o.success),
    };
  }

  async getResponseHistory(incidentId: string): Promise<import('../../domain/entities/response-plan.entity').ResponsePlanEntity[]> {
    return this.planRepository.findByIncidentId(incidentId);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────
  private selectTarget(actionType: ResponseActionType, targets: TargetAsset[]): TargetAsset {
    if (targets.length === 0) {
      return {};
    }
    // Route action to the most appropriate target
    switch (actionType) {
      case ResponseActionType.BLOCK_IP:
        return targets.find((t) => t.ipAddress || t.domain) ?? targets[0];
      case ResponseActionType.ISOLATE_ENDPOINT:
        return targets.find((t) => t.hostname || t.assetId) ?? targets[0];
      case ResponseActionType.DISABLE_USER:
        return targets.find((t) => t.userId) ?? targets[0];
      case ResponseActionType.QUARANTINE_FILE:
        return targets.find((t) => t.filePath || t.fileHash) ?? targets[0];
      default:
        return targets[0];
    }
  }

  private async rollbackPreviousActions(
    planId: string,
    decorators: RollbackDecorator[],
  ): Promise<void> {
    for (const decorator of [...decorators].reverse()) {
      const ctx = decorator.getCapturedRollbackContext();
      if (ctx && decorator.isReversible()) {
        try {
          await decorator.rollback(ctx);
        } catch (err) {
          this.logger.error(
            `[IncidentResponseFacade] Rollback failed for ${decorator.getType()}: ` +
              (err as Error).message,
          );
        }
      }
    }
  }
}
