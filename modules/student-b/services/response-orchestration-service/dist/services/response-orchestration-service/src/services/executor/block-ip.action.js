"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BlockIPAction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockIPAction = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let BlockIPAction = BlockIPAction_1 = class BlockIPAction {
    constructor() {
        this.logger = new common_1.Logger(BlockIPAction_1.name);
    }
    getType() {
        return enums_1.ResponseActionType.BLOCK_IP;
    }
    isReversible() {
        return true;
    }
    describe() {
        return 'Block IP address at firewall/network perimeter layer';
    }
    async execute(target) {
        const actionId = (0, uuid_1.v4)();
        const ip = target.ipAddress ?? target.domain;
        if (!ip) {
            return {
                actionId,
                actionType: enums_1.ResponseActionType.BLOCK_IP,
                status: enums_1.ResponseActionStatus.FAILED,
                success: false,
                message: 'BlockIPAction requires ipAddress or domain on target asset',
                executedAt: new Date().toISOString(),
            };
        }
        this.logger.log(`[BlockIPAction] Blocking IP: ${ip}`);
        try {
            await this.simulateFirewallApiCall(ip, 'BLOCK');
            const rollbackContext = {
                snapshotId: (0, uuid_1.v4)(),
                previousState: { ip, ruleAction: 'ALLOW' },
                rollbackInstructions: `Remove block rule for ${ip} and restore ALLOW rule`,
                canAutoRollback: true,
            };
            this.logger.log(`[BlockIPAction] Successfully blocked ${ip}`);
            return {
                actionId,
                actionType: enums_1.ResponseActionType.BLOCK_IP,
                status: enums_1.ResponseActionStatus.SUCCESS,
                success: true,
                message: `IP ${ip} has been blocked at the network perimeter`,
                executedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                rollbackContext,
                metadata: { blockedIp: ip, ruleId: `rule-${actionId.slice(0, 8)}` },
            };
        }
        catch (err) {
            this.logger.error(`[BlockIPAction] Failed to block ${ip}: ${err.message}`);
            return {
                actionId,
                actionType: enums_1.ResponseActionType.BLOCK_IP,
                status: enums_1.ResponseActionStatus.FAILED,
                success: false,
                message: `Failed to block IP ${ip}: ${err.message}`,
                executedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
            };
        }
    }
    async rollback(context) {
        const actionId = (0, uuid_1.v4)();
        const ip = context.previousState?.ip ?? 'unknown';
        this.logger.log(`[BlockIPAction] Rolling back block for IP: ${ip}`);
        try {
            await this.simulateFirewallApiCall(ip, 'ALLOW');
            return {
                actionId,
                actionType: enums_1.ResponseActionType.BLOCK_IP,
                status: enums_1.ResponseActionStatus.ROLLED_BACK,
                success: true,
                message: `IP ${ip} block has been removed. ALLOW rule restored.`,
                executedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                metadata: { restoredIp: ip, snapshotId: context.snapshotId },
            };
        }
        catch (err) {
            return {
                actionId,
                actionType: enums_1.ResponseActionType.BLOCK_IP,
                status: enums_1.ResponseActionStatus.FAILED,
                success: false,
                message: `Rollback failed for IP ${ip}: ${err.message}`,
                executedAt: new Date().toISOString(),
            };
        }
    }
    async simulateFirewallApiCall(ip, action) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        this.logger.debug(`[BlockIPAction] Firewall API: ${action} ${ip} → OK`);
    }
};
exports.BlockIPAction = BlockIPAction;
exports.BlockIPAction = BlockIPAction = BlockIPAction_1 = __decorate([
    (0, common_1.Injectable)()
], BlockIPAction);
//# sourceMappingURL=block-ip.action.js.map