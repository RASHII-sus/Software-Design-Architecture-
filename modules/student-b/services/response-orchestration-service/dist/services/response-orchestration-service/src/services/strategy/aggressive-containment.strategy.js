"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggressiveContainmentStrategy = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../../../../shared/contracts/enums");
let AggressiveContainmentStrategy = class AggressiveContainmentStrategy {
    getName() {
        return 'AggressiveContainmentStrategy';
    }
    getDescription() {
        return ('Maximum containment speed. Isolates endpoint, blocks IPs, disables ' +
            'user accounts, and quarantines files simultaneously. Requires approval ' +
            'for user account actions. Use for CRITICAL incidents on high-value assets.');
    }
    determineActions(context) {
        const actions = [
            enums_1.ResponseActionType.ISOLATE_ENDPOINT,
            enums_1.ResponseActionType.BLOCK_IP,
            enums_1.ResponseActionType.QUARANTINE_FILE,
        ];
        if (context.severity === enums_1.Severity.CRITICAL ||
            context.assetCriticality === 'CRITICAL') {
            actions.push(enums_1.ResponseActionType.DISABLE_USER);
            actions.push(enums_1.ResponseActionType.ESCALATE);
        }
        return {
            strategyName: this.getName(),
            actionTypes: actions,
            requiresApproval: context.assetCriticality === 'CRITICAL',
            autoRollbackOnFailure: true,
            rationale: `Aggressive containment selected: severity=${context.severity}, ` +
                `assetCriticality=${context.assetCriticality}. ` +
                `Prioritizing containment speed over service disruption risk.`,
        };
    }
};
exports.AggressiveContainmentStrategy = AggressiveContainmentStrategy;
exports.AggressiveContainmentStrategy = AggressiveContainmentStrategy = __decorate([
    (0, common_1.Injectable)()
], AggressiveContainmentStrategy);
//# sourceMappingURL=aggressive-containment.strategy.js.map