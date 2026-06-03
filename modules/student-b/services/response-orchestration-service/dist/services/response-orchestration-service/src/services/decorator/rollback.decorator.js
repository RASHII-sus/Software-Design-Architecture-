"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbackDecorator = void 0;
const response_action_decorator_1 = require("./response-action.decorator");
const enums_1 = require("../../../../../shared/contracts/enums");
class RollbackDecorator extends response_action_decorator_1.ResponseActionDecorator {
    constructor(wrappedAction, autoRollbackOnFailure) {
        super(wrappedAction);
        this.autoRollbackOnFailure = autoRollbackOnFailure;
        this.capturedRollbackContext = null;
        this.lastOutcome = null;
    }
    async execute(target) {
        const outcome = await this.wrappedAction.execute(target);
        if (outcome.success && outcome.rollbackContext) {
            this.capturedRollbackContext = outcome.rollbackContext;
            this.logger.debug(`[RollbackDecorator] Captured rollback context for ${this.getType()} ` +
                `(snapshotId=${outcome.rollbackContext.snapshotId ?? 'none'}, ` +
                `canAutoRollback=${outcome.rollbackContext.canAutoRollback})`);
        }
        this.lastOutcome = outcome;
        return outcome;
    }
    async rollback(context) {
        const ctx = context ?? this.capturedRollbackContext;
        if (!ctx) {
            this.logger.warn(`[RollbackDecorator] No rollback context available for ${this.getType()}`);
            return {
                actionId: `rollback-failed-${Date.now()}`,
                actionType: this.getType(),
                status: enums_1.ResponseActionStatus.FAILED,
                success: false,
                message: `Cannot rollback ${this.getType()}: no rollback context captured`,
                executedAt: new Date().toISOString(),
            };
        }
        if (!ctx.canAutoRollback && this.autoRollbackOnFailure) {
            this.logger.warn(`[RollbackDecorator] Action ${this.getType()} does not support auto-rollback. ` +
                `Manual intervention required: ${ctx.rollbackInstructions}`);
        }
        return this.wrappedAction.rollback(ctx);
    }
    getCapturedRollbackContext() {
        return this.capturedRollbackContext;
    }
    getLastOutcome() {
        return this.lastOutcome;
    }
}
exports.RollbackDecorator = RollbackDecorator;
//# sourceMappingURL=rollback.decorator.js.map