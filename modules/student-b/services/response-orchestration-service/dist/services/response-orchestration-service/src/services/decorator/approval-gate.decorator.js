"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalGateDecorator = void 0;
const response_action_decorator_1 = require("./response-action.decorator");
const enums_1 = require("../../../../../shared/contracts/enums");
class ApprovalGateDecorator extends response_action_decorator_1.ResponseActionDecorator {
    constructor(wrappedAction, requiresApproval) {
        super(wrappedAction);
        this.requiresApproval = requiresApproval;
        this.approved = false;
    }
    async execute(target) {
        if (this.requiresApproval && !this.approved) {
            this.logger.warn(`[ApprovalGateDecorator] Execution BLOCKED — action=${this.getType()} requires approval`);
            return {
                actionId: `pending-${Date.now()}`,
                actionType: this.getType(),
                status: enums_1.ResponseActionStatus.PENDING,
                success: false,
                message: `Action ${this.getType()} is pending approval before execution`,
                executedAt: new Date().toISOString(),
                metadata: { requiresApproval: true, approvalStatus: 'PENDING' },
            };
        }
        if (this.approved) {
            this.logger.log(`[ApprovalGateDecorator] Approval GRANTED by ${this.approvedBy ?? 'system'} ` +
                `at ${this.approvedAt?.toISOString()} — proceeding with ${this.getType()}`);
        }
        return this.wrappedAction.execute(target);
    }
    async rollback(context) {
        return this.wrappedAction.rollback(context);
    }
    grant(approvedBy) {
        this.approved = true;
        this.approvedBy = approvedBy;
        this.approvedAt = new Date();
        this.logger.log(`[ApprovalGateDecorator] Approval granted for ${this.getType()} by ${approvedBy}`);
    }
    isApproved() {
        return this.approved;
    }
}
exports.ApprovalGateDecorator = ApprovalGateDecorator;
//# sourceMappingURL=approval-gate.decorator.js.map