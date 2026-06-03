import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
export declare class ApprovalGateDecorator extends ResponseActionDecorator {
    private readonly requiresApproval;
    private approved;
    private approvedBy;
    private approvedAt;
    constructor(wrappedAction: ResponseAction, requiresApproval: boolean);
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context: RollbackContext): Promise<ActionOutcome>;
    grant(approvedBy: string): void;
    isApproved(): boolean;
}
