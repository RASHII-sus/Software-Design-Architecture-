import { ResponseAction } from '../executor/response-action.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { BlockIPAction } from '../executor/block-ip.action';
import { IsolateEndpointAction } from '../executor/isolate-endpoint.action';
import { DisableUserAction } from '../executor/disable-user.action';
import { QuarantineFileAction } from '../executor/quarantine-file.action';
import { EscalateAction } from '../executor/escalate.action';
export declare class ResponseActionFactory {
    private readonly blockIPAction;
    private readonly isolateEndpointAction;
    private readonly disableUserAction;
    private readonly quarantineFileAction;
    private readonly escalateAction;
    private readonly logger;
    private readonly registry;
    constructor(blockIPAction: BlockIPAction, isolateEndpointAction: IsolateEndpointAction, disableUserAction: DisableUserAction, quarantineFileAction: QuarantineFileAction, escalateAction: EscalateAction);
    createAction(type: ResponseActionType): ResponseAction;
    getSupportedTypes(): ResponseActionType[];
    isSupported(type: ResponseActionType): boolean;
}
