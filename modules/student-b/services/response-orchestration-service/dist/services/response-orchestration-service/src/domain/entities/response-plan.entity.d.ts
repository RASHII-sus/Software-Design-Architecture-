import { ResponsePlanStatus } from '../../../../../shared/contracts/enums';
import { ResponseActionEntity } from './response-action.entity';
export declare class ResponsePlanEntity {
    id: string;
    incidentId: string;
    strategyName: string;
    status: ResponsePlanStatus;
    context: Record<string, unknown>;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    actions: ResponseActionEntity[];
}
