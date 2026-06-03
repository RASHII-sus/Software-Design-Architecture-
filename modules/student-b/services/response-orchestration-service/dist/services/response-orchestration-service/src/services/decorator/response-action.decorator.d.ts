import { Logger } from '@nestjs/common';
import { ResponseAction } from '../executor/response-action.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
export declare abstract class ResponseActionDecorator implements ResponseAction {
    protected readonly wrappedAction: ResponseAction;
    protected readonly logger: Logger;
    constructor(wrappedAction: ResponseAction);
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context: RollbackContext): Promise<ActionOutcome>;
    getType(): ResponseActionType;
    isReversible(): boolean;
    describe(): string;
}
