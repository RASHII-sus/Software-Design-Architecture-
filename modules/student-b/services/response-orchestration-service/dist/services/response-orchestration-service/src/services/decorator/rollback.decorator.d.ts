import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
export declare class RollbackDecorator extends ResponseActionDecorator {
    private readonly autoRollbackOnFailure;
    private capturedRollbackContext;
    private lastOutcome;
    constructor(wrappedAction: ResponseAction, autoRollbackOnFailure: boolean);
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context?: RollbackContext): Promise<ActionOutcome>;
    getCapturedRollbackContext(): RollbackContext | null;
    getLastOutcome(): ActionOutcome | null;
}
