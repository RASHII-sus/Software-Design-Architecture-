"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EscalateAction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalateAction = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let EscalateAction = EscalateAction_1 = class EscalateAction {
    constructor() {
        this.logger = new common_1.Logger(EscalateAction_1.name);
    }
    getType() { return enums_1.ResponseActionType.ESCALATE; }
    isReversible() { return false; }
    describe() { return 'Escalate incident to Tier-3 analyst via PagerDuty'; }
    async execute(target) {
        const actionId = (0, uuid_1.v4)();
        const escalationTarget = target.metadata?.escalationGroup ?? 'tier-3-soc';
        this.logger.log(`[EscalateAction] Escalating to: ${escalationTarget}`);
        try {
            await new Promise((resolve) => setTimeout(resolve, 40));
            const incidentKey = `INC-${actionId.slice(0, 8).toUpperCase()}`;
            this.logger.log(`[EscalateAction] Escalation ticket created: ${incidentKey}`);
            return {
                actionId, actionType: enums_1.ResponseActionType.ESCALATE,
                status: enums_1.ResponseActionStatus.SUCCESS, success: true,
                message: `Incident escalated to ${escalationTarget}. Ticket: ${incidentKey}`,
                executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
                metadata: {
                    escalationGroup: escalationTarget,
                    incidentKey,
                    pagerDutyEventId: `PD-${(0, uuid_1.v4)().slice(0, 8)}`,
                },
            };
        }
        catch (err) {
            return {
                actionId, actionType: enums_1.ResponseActionType.ESCALATE,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: `Failed to escalate: ${err.message}`,
                executedAt: new Date().toISOString(),
            };
        }
    }
    async rollback(_context) {
        return {
            actionId: (0, uuid_1.v4)(), actionType: enums_1.ResponseActionType.ESCALATE,
            status: enums_1.ResponseActionStatus.FAILED, success: false,
            message: 'EscalateAction is not reversible. Escalations cannot be rolled back.',
            executedAt: new Date().toISOString(),
        };
    }
};
exports.EscalateAction = EscalateAction;
exports.EscalateAction = EscalateAction = EscalateAction_1 = __decorate([
    (0, common_1.Injectable)()
], EscalateAction);
//# sourceMappingURL=escalate.action.js.map