"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ResponseActionFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseActionFactory = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../../../../shared/contracts/enums");
const block_ip_action_1 = require("../executor/block-ip.action");
const isolate_endpoint_action_1 = require("../executor/isolate-endpoint.action");
const disable_user_action_1 = require("../executor/disable-user.action");
const quarantine_file_action_1 = require("../executor/quarantine-file.action");
const escalate_action_1 = require("../executor/escalate.action");
let ResponseActionFactory = ResponseActionFactory_1 = class ResponseActionFactory {
    constructor(blockIPAction, isolateEndpointAction, disableUserAction, quarantineFileAction, escalateAction) {
        this.blockIPAction = blockIPAction;
        this.isolateEndpointAction = isolateEndpointAction;
        this.disableUserAction = disableUserAction;
        this.quarantineFileAction = quarantineFileAction;
        this.escalateAction = escalateAction;
        this.logger = new common_1.Logger(ResponseActionFactory_1.name);
        this.registry = new Map([
            [enums_1.ResponseActionType.BLOCK_IP, this.blockIPAction],
            [enums_1.ResponseActionType.ISOLATE_ENDPOINT, this.isolateEndpointAction],
            [enums_1.ResponseActionType.DISABLE_USER, this.disableUserAction],
            [enums_1.ResponseActionType.QUARANTINE_FILE, this.quarantineFileAction],
            [enums_1.ResponseActionType.ESCALATE, this.escalateAction],
        ]);
        this.logger.log(`[ResponseActionFactory] Registered ${this.registry.size} action types: ` +
            Array.from(this.registry.keys()).join(', '));
    }
    createAction(type) {
        const action = this.registry.get(type);
        if (!action) {
            throw new Error(`ResponseActionFactory: No action registered for type '${type}'. ` +
                `Registered types: ${Array.from(this.registry.keys()).join(', ')}`);
        }
        this.logger.debug(`[ResponseActionFactory] Creating action: ${type} → ${action.describe()}`);
        return action;
    }
    getSupportedTypes() {
        return Array.from(this.registry.keys());
    }
    isSupported(type) {
        return this.registry.has(type);
    }
};
exports.ResponseActionFactory = ResponseActionFactory;
exports.ResponseActionFactory = ResponseActionFactory = ResponseActionFactory_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [block_ip_action_1.BlockIPAction,
        isolate_endpoint_action_1.IsolateEndpointAction,
        disable_user_action_1.DisableUserAction,
        quarantine_file_action_1.QuarantineFileAction,
        escalate_action_1.EscalateAction])
], ResponseActionFactory);
//# sourceMappingURL=response-action.factory.js.map