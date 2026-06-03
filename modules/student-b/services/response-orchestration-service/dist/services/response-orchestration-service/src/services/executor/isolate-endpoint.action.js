"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IsolateEndpointAction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsolateEndpointAction = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let IsolateEndpointAction = IsolateEndpointAction_1 = class IsolateEndpointAction {
    constructor() {
        this.logger = new common_1.Logger(IsolateEndpointAction_1.name);
    }
    getType() { return enums_1.ResponseActionType.ISOLATE_ENDPOINT; }
    isReversible() { return true; }
    describe() { return 'Isolate endpoint via EDR (network quarantine mode)'; }
    async execute(target) {
        const actionId = (0, uuid_1.v4)();
        const hostname = target.hostname ?? target.assetId;
        if (!hostname) {
            return {
                actionId, actionType: enums_1.ResponseActionType.ISOLATE_ENDPOINT,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: 'IsolateEndpointAction requires hostname or assetId',
                executedAt: new Date().toISOString(),
            };
        }
        this.logger.log(`[IsolateEndpointAction] Isolating endpoint: ${hostname}`);
        try {
            await new Promise((resolve) => setTimeout(resolve, 80));
            const rollbackContext = {
                snapshotId: (0, uuid_1.v4)(),
                previousState: { hostname, networkStatus: 'CONNECTED' },
                rollbackInstructions: `Lift network isolation for ${hostname} via EDR console`,
                canAutoRollback: true,
            };
            this.logger.log(`[IsolateEndpointAction] Endpoint ${hostname} isolated`);
            return {
                actionId, actionType: enums_1.ResponseActionType.ISOLATE_ENDPOINT,
                status: enums_1.ResponseActionStatus.SUCCESS, success: true,
                message: `Endpoint ${hostname} has been isolated from the network`,
                executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
                rollbackContext,
                metadata: { isolatedHost: hostname, edrJobId: `edr-${actionId.slice(0, 8)}` },
            };
        }
        catch (err) {
            return {
                actionId, actionType: enums_1.ResponseActionType.ISOLATE_ENDPOINT,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: `Failed to isolate ${hostname}: ${err.message}`,
                executedAt: new Date().toISOString(),
            };
        }
    }
    async rollback(context) {
        const actionId = (0, uuid_1.v4)();
        const hostname = context.previousState?.hostname ?? 'unknown';
        this.logger.log(`[IsolateEndpointAction] Lifting isolation for: ${hostname}`);
        await new Promise((resolve) => setTimeout(resolve, 80));
        return {
            actionId, actionType: enums_1.ResponseActionType.ISOLATE_ENDPOINT,
            status: enums_1.ResponseActionStatus.ROLLED_BACK, success: true,
            message: `Network isolation lifted for ${hostname}`,
            executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        };
    }
};
exports.IsolateEndpointAction = IsolateEndpointAction;
exports.IsolateEndpointAction = IsolateEndpointAction = IsolateEndpointAction_1 = __decorate([
    (0, common_1.Injectable)()
], IsolateEndpointAction);
//# sourceMappingURL=isolate-endpoint.action.js.map