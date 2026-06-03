import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
interface ActionMetrics {
    actionType: string;
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    totalDurationMs: number;
    lastExecutedAt?: string;
}
export declare class MetricsDecorator extends ResponseActionDecorator {
    constructor(wrappedAction: ResponseAction);
    execute(target: TargetAsset): Promise<ActionOutcome>;
    rollback(context: RollbackContext): Promise<ActionOutcome>;
    private recordMetric;
    static getMetrics(): ActionMetrics[];
}
export {};
