"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QuarantineFileAction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarantineFileAction = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let QuarantineFileAction = QuarantineFileAction_1 = class QuarantineFileAction {
    constructor() {
        this.logger = new common_1.Logger(QuarantineFileAction_1.name);
    }
    getType() { return enums_1.ResponseActionType.QUARANTINE_FILE; }
    isReversible() { return true; }
    describe() { return 'Quarantine malicious file via EDR'; }
    async execute(target) {
        const actionId = (0, uuid_1.v4)();
        const filePath = target.filePath ?? target.fileHash;
        if (!filePath) {
            return {
                actionId, actionType: enums_1.ResponseActionType.QUARANTINE_FILE,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: 'QuarantineFileAction requires filePath or fileHash on target asset',
                executedAt: new Date().toISOString(),
            };
        }
        this.logger.log(`[QuarantineFileAction] Quarantining: ${filePath}`);
        try {
            await new Promise((resolve) => setTimeout(resolve, 70));
            const rollbackContext = {
                snapshotId: (0, uuid_1.v4)(),
                previousState: { filePath, fileHash: target.fileHash, originalLocation: filePath },
                rollbackInstructions: `Restore file ${filePath} from EDR quarantine vault`,
                canAutoRollback: true,
            };
            this.logger.log(`[QuarantineFileAction] File quarantined: ${filePath}`);
            return {
                actionId, actionType: enums_1.ResponseActionType.QUARANTINE_FILE,
                status: enums_1.ResponseActionStatus.SUCCESS, success: true,
                message: `File ${filePath} has been quarantined`,
                executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
                rollbackContext,
                metadata: { quarantinedPath: filePath, quarantineId: `Q-${actionId.slice(0, 8)}` },
            };
        }
        catch (err) {
            return {
                actionId, actionType: enums_1.ResponseActionType.QUARANTINE_FILE,
                status: enums_1.ResponseActionStatus.FAILED, success: false,
                message: `Failed to quarantine ${filePath}: ${err.message}`,
                executedAt: new Date().toISOString(),
            };
        }
    }
    async rollback(context) {
        const actionId = (0, uuid_1.v4)();
        const filePath = context.previousState?.filePath ?? 'unknown';
        this.logger.log(`[QuarantineFileAction] Restoring from quarantine: ${filePath}`);
        await new Promise((resolve) => setTimeout(resolve, 70));
        return {
            actionId, actionType: enums_1.ResponseActionType.QUARANTINE_FILE,
            status: enums_1.ResponseActionStatus.ROLLED_BACK, success: true,
            message: `File ${filePath} restored from quarantine`,
            executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        };
    }
};
exports.QuarantineFileAction = QuarantineFileAction;
exports.QuarantineFileAction = QuarantineFileAction = QuarantineFileAction_1 = __decorate([
    (0, common_1.Injectable)()
], QuarantineFileAction);
//# sourceMappingURL=quarantine-file.action.js.map