import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
export declare class AuditLogDecorator extends ResponseActionDecorator {
    private readonly auditLog;
    constructor(wrappedAction: ResponseAction);
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context: RollbackContext): Promise<ActionOutcome>;
    getAuditTrail(): {
        timestamp: string;
        event: string;
        actionType: string;
        target: unknown;
        outcome?: unknown;
    }[];
}
