"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DisableUserAction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisableUserAction = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let DisableUserAction = DisableUserAction_1 = class DisableUserAction {
    constructor() {
        this.logger = new common_1.Logger(DisableUserAction_1.name);
    }
    getType() { return enums_1.ResponseActionType.DISABLE_USER; }
    isReversible() { return true; }
    describe() { return 'Disable user account in Active Directory / IdP'; }
    async execute(target) {
        const actionId = (0, uuid_1.v4)();
        const userId = target.userId;
        if (!userId) {
            return {
                actionId, actionType: enums_1.ResponseActionType.DISABLE_USER,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: 'DisableUserAction requires userId on target asset',
                executedAt: new Date().toISOString(),
            };
        }
        this.logger.log(`[DisableUserAction] Disabling user account: ${userId}`);
        try {
            await new Promise((resolve) => setTimeout(resolve, 60));
            const rollbackContext = {
                snapshotId: (0, uuid_1.v4)(),
                previousState: { userId, accountStatus: 'ENABLED', groupMemberships: [] },
                rollbackInstructions: `Re-enable account ${userId} in Active Directory`,
                canAutoRollback: true,
            };
            this.logger.log(`[DisableUserAction] User account ${userId} disabled`);
            return {
                actionId, actionType: enums_1.ResponseActionType.DISABLE_USER,
                status: enums_1.ResponseActionStatus.SUCCESS, success: true,
                message: `User account ${userId} has been disabled`,
                executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
                rollbackContext,
                metadata: { disabledUserId: userId, ticketId: `AD-${actionId.slice(0, 8)}` },
            };
        }
        catch (err) {
            return {
                actionId, actionType: enums_1.ResponseActionType.DISABLE_USER,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: `Failed to disable user ${userId}: ${err.message}`,
                executedAt: new Date().toISOString(),
            };
        }
    }
    async rollback(context) {
        const actionId = (0, uuid_1.v4)();
        const userId = context.previousState?.userId ?? 'unknown';
        this.logger.log(`[DisableUserAction] Re-enabling user: ${userId}`);
        await new Promise((resolve) => setTimeout(resolve, 60));
        return {
            actionId, actionType: enums_1.ResponseActionType.DISABLE_USER,
            status: enums_1.ResponseActionStatus.ROLLED_BACK, success: true,
            message: `User account ${userId} has been re-enabled`,
            executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        };
    }
};
exports.DisableUserAction = DisableUserAction;
exports.DisableUserAction = DisableUserAction = DisableUserAction_1 = __decorate([
    (0, common_1.Injectable)()
], DisableUserAction);
//# sourceMappingURL=disable-user.action.js.map