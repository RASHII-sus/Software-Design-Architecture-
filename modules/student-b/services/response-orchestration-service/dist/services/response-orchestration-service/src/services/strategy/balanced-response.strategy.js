"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancedResponseStrategy = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../../../../shared/contracts/enums");
let BalancedResponseStrategy = class BalancedResponseStrategy {
    getName() {
        return 'BalancedResponseStrategy';
    }
    getDescription() {
        return ('Balanced risk/impact response. Blocks network indicators and quarantines ' +
            'files but avoids full endpoint isolation. Escalates for human review. ' +
            'Use for HIGH severity incidents on MEDIUM/HIGH criticality assets.');
    }
    determineActions(context) {
        const actions = [
            enums_1.ResponseActionType.BLOCK_IP,
            enums_1.ResponseActionType.QUARANTINE_FILE,
        ];
        if (context.assetCriticality === 'HIGH' || context.assetCriticality === 'CRITICAL') {
            actions.push(enums_1.ResponseActionType.ESCALATE);
        }
        return {
            strategyName: this.getName(),
            actionTypes: actions,
            requiresApproval: false,
            autoRollbackOnFailure: true,
            rationale: `Balanced strategy selected: severity=${context.severity}, ` +
                `assetCriticality=${context.assetCriticality}. ` +
                `Containing network vector while preserving endpoint availability.`,
        };
    }
};
exports.BalancedResponseStrategy = BalancedResponseStrategy;
exports.BalancedResponseStrategy = BalancedResponseStrategy = __decorate([
    (0, common_1.Injectable)()
], BalancedResponseStrategy);
//# sourceMappingURL=balanced-response.strategy.js.map