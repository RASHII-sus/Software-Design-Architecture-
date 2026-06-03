// services/response-orchestration-service/src/services/decorator/rollback.decorator.ts
// PATTERN: Decorator (RollbackDecorator)
// Captures the rollback context produced by a successful execution and
// automatically triggers rollback if the overall plan fails after this action.

import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
import { ResponseActionStatus } from '../../../../../shared/contracts/enums';

export class RollbackDecorator extends ResponseActionDecorator {
  private capturedRollbackContext: RollbackContext | null = null;
  private lastOutcome: ActionOutcome | null = null;

  constructor(
    wrappedAction: ResponseAction,
    private readonly autoRollbackOnFailure: boolean,
  ) {
    super(wrappedAction);
  }

  // PATTERN: Decorator — captures rollback context after successful execution
  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const outcome = await this.wrappedAction.execute(target);

    if (outcome.success && outcome.rollbackContext) {
      this.capturedRollbackContext = outcome.rollbackContext;
      this.logger.debug(
        `[RollbackDecorator] Captured rollback context for ${this.getType()} ` +
          `(snapshotId=${outcome.rollbackContext.snapshotId ?? 'none'}, ` +
          `canAutoRollback=${outcome.rollbackContext.canAutoRollback})`,
      );
    }

    this.lastOutcome = outcome;
    return outcome;
  }

  /**
   * Called by the Facade when rolling back the entire plan.
   * Uses the captured context from the prior successful execution.
   */
  async rollback(context?: RollbackContext): Promise<ActionOutcome> {
    const ctx = context ?? this.capturedRollbackContext;

    if (!ctx) {
      this.logger.warn(
        `[RollbackDecorator] No rollback context available for ${this.getType()}`,
      );
      return {
        actionId: `rollback-failed-${Date.now()}`,
        actionType: this.getType(),
        status: ResponseActionStatus.FAILED,
        success: false,
        message: `Cannot rollback ${this.getType()}: no rollback context captured`,
        executedAt: new Date().toISOString(),
      };
    }

    if (!ctx.canAutoRollback && this.autoRollbackOnFailure) {
      this.logger.warn(
        `[RollbackDecorator] Action ${this.getType()} does not support auto-rollback. ` +
          `Manual intervention required: ${ctx.rollbackInstructions}`,
      );
    }

    return this.wrappedAction.rollback(ctx);
  }

  getCapturedRollbackContext(): RollbackContext | null {
    return this.capturedRollbackContext;
  }

  getLastOutcome(): ActionOutcome | null {
    return this.lastOutcome;
  }
}
