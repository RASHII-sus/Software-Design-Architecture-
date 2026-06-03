"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogDecorator = void 0;
const response_action_decorator_1 = require("./response-action.decorator");
class AuditLogDecorator extends response_action_decorator_1.ResponseActionDecorator {
    constructor(wrappedAction) {
        super(wrappedAction);
        this.auditLog = [];
    }
    async execute(target) {
        const pre = {
            timestamp: new Date().toISOString(),
            event: 'PRE_EXECUTION',
            actionType: this.getType(),
            target,
        };
        this.auditLog.push(pre);
        this.logger.log(`[AuditLogDecorator] PRE_EXECUTION — action=${this.getType()}, ` +
            `target=${JSON.stringify({ ip: target.ipAddress, host: target.hostname, user: target.userId })}`);
        const outcome = await this.wrappedAction.execute(target);
        const post = {
            timestamp: new Date().toISOString(),
            event: 'POST_EXECUTION',
            actionType: this.getType(),
            target,
            outcome: { success: outcome.success, status: outcome.status, message: outcome.message },
        };
        this.auditLog.push(post);
        this.logger.log(`[AuditLogDecorator] POST_EXECUTION — action=${this.getType()}, ` +
            `success=${outcome.success}, status=${outcome.status}`);
        return outcome;
    }
    async rollback(context) {
        this.logger.log(`[AuditLogDecorator] ROLLBACK_INITIATED — action=${this.getType()}`);
        this.auditLog.push({
            timestamp: new Date().toISOString(),
            event: 'ROLLBACK_INITIATED',
            actionType: this.getType(),
            target: context,
        });
        const outcome = await this.wrappedAction.rollback(context);
        this.auditLog.push({
            timestamp: new Date().toISOString(),
            event: 'ROLLBACK_COMPLETED',
            actionType: this.getType(),
            target: context,
            outcome: { success: outcome.success, status: outcome.status },
        });
        return outcome;
    }
    getAuditTrail() {
        return [...this.auditLog];
    }
}
exports.AuditLogDecorator = AuditLogDecorator;
//# sourceMappingURL=audit-log.decorator.js.map