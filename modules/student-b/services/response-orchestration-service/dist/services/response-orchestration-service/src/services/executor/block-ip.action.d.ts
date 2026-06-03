import { ResponseAction } from './response-action.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
export declare class BlockIPAction implements ResponseAction {
    private readonly logger;
    getType(): ResponseActionType;
    isReversible(): boolean;
    describe(): string;
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context: RollbackContext): Promise<ActionOutcome>;
    private simulateFirewallApiCall;
}
