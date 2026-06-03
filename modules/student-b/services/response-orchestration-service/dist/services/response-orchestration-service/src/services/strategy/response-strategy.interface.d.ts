import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';
export interface ResponsePlan {
    strategyName: string;
    actionTypes: ResponseActionType[];
    requiresApproval: boolean;
    autoRollbackOnFailure: boolean;
    rationale: string;
}
export interface ResponseStrategy {
    determineActions(context: ResponseContext): ResponsePlan;
    getName(): string;
    getDescription(): string;
}
