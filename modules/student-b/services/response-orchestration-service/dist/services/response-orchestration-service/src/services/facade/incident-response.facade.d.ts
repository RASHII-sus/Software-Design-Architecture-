import { ConfigService } from '@nestjs/config';
import { ResponseStrategySelector } from '../strategy/response-strategy.selector';
import { ResponseActionFactory } from '../factory/response-action.factory';
import { ResponsePlanRepository } from '../../domain/repositories/response-plan.repository';
import { ResponseActionRepository } from '../../domain/repositories/response-action.repository';
import { ResponseOrchestrationEventPublisher } from '../../events/response-orchestration-event.publisher';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { ResponseContext, TargetAsset, ActionOutcome } from '../../../../../shared/contracts/interfaces';
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
export declare class IncidentResponseFacade {
    private readonly strategySelector;
    private readonly actionFactory;
    private readonly planRepository;
    private readonly actionRepository;
    private readonly eventPublisher;
    private readonly config;
    private readonly logger;
    private readonly requireApprovalForCritical;
    private readonly autoRollbackOnFailure;
    constructor(strategySelector: ResponseStrategySelector, actionFactory: ResponseActionFactory, planRepository: ResponsePlanRepository, actionRepository: ResponseActionRepository, eventPublisher: ResponseOrchestrationEventPublisher, config: ConfigService);
    assessAndRespond(incidentId: string, context: ResponseContext, targetAssets: TargetAsset[]): Promise<AssessAndRespondResult>;
    rollbackPlan(responsePlanId: string): Promise<RollbackResult>;
    getResponseHistory(incidentId: string): Promise<import('../../domain/entities/response-plan.entity').ResponsePlanEntity[]>;
    private selectTarget;
    private rollbackPreviousActions;
}
