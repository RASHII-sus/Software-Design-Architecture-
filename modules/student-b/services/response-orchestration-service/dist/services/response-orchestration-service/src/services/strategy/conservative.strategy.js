"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConservativeStrategy = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../../../../shared/contracts/enums");
let ConservativeStrategy = class ConservativeStrategy {
    getName() {
        return 'ConservativeStrategy';
    }
    getDescription() {
        return ('Minimal disruption response. Only blocks the source IP at network level. ' +
            'Escalates to analyst for further decisions. ' +
            'Use for MEDIUM severity incidents or business-critical production systems.');
    }
    determineActions(context) {
        const actions = [
            enums_1.ResponseActionType.BLOCK_IP,
            enums_1.ResponseActionType.ESCALATE,
        ];
        return {
            strategyName: this.getName(),
            actionTypes: actions,
            requiresApproval: false,
            autoRollbackOnFailure: true,
            rationale: `Conservative strategy selected: severity=${context.severity}, ` +
                `assetCriticality=${context.assetCriticality}. ` +
                `Minimizing business disruption while maintaining basic containment.`,
        };
    }
};
exports.ConservativeStrategy = ConservativeStrategy;
exports.ConservativeStrategy = ConservativeStrategy = __decorate([
    (0, common_1.Injectable)()
], ConservativeStrategy);
//# sourceMappingURL=conservative.strategy.js.map