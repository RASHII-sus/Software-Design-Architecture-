import { ResponseActionType, ResponseActionStatus } from '../../../../../shared/contracts/enums';
import { ResponsePlanEntity } from './response-plan.entity';
export declare class ResponseActionEntity {
    id: string;
    responsePlanId: string;
    responsePlan: ResponsePlanEntity;
    actionType: ResponseActionType;
    targetAsset: Record<string, unknown>;
    status: ResponseActionStatus;
    outcome: Record<string, unknown> | null;
    rollbackContext: Record<string, unknown> | null;
    requiresApproval: boolean;
    approvedBy: string | null;
    approvedAt: Date | null;
    executedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
