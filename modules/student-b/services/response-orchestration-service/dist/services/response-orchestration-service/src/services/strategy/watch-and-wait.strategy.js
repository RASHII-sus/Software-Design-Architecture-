"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchAndWaitStrategy = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../../../../shared/contracts/enums");
let WatchAndWaitStrategy = class WatchAndWaitStrategy {
    getName() {
        return 'WatchAndWaitStrategy';
    }
    getDescription() {
        return ('No automated containment actions. Escalates to analyst for manual decision. ' +
            'Appropriate for LOW/INFORMATIONAL severity, suspected false positives, ' +
            'or incidents where automated actions carry unacceptable business risk.');
    }
    determineActions(context) {
        const actions = [enums_1.ResponseActionType.ESCALATE];
        return {
            strategyName: this.getName(),
            actionTypes: actions,
            requiresApproval: false,
            autoRollbackOnFailure: false,
            rationale: `Watch-and-wait strategy selected: severity=${context.severity}, ` +
                `assetCriticality=${context.assetCriticality}. ` +
                `Deferring containment decision to SOC analyst. No automated actions taken.`,
        };
    }
};
exports.WatchAndWaitStrategy = WatchAndWaitStrategy;
exports.WatchAndWaitStrategy = WatchAndWaitStrategy = __decorate([
    (0, common_1.Injectable)()
], WatchAndWaitStrategy);
//# sourceMappingURL=watch-and-wait.strategy.js.map