import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
export interface ResponseAction {
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context: RollbackContext): Promise<ActionOutcome>;
    getType(): ResponseActionType;
    isReversible(): boolean;
    describe(): string;
}
export declare const RESPONSE_ACTION = "RESPONSE_ACTION";
