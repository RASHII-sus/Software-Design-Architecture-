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
var ResponseStrategySelector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseStrategySelector = void 0;
const common_1 = require("@nestjs/common");
const aggressive_containment_strategy_1 = require("./aggressive-containment.strategy");
const balanced_response_strategy_1 = require("./balanced-response.strategy");
const conservative_strategy_1 = require("./conservative.strategy");
const watch_and_wait_strategy_1 = require("./watch-and-wait.strategy");
const enums_1 = require("../../../../../shared/contracts/enums");
let ResponseStrategySelector = ResponseStrategySelector_1 = class ResponseStrategySelector {
    constructor(aggressive, balanced, conservative, watchAndWait) {
        this.aggressive = aggressive;
        this.balanced = balanced;
        this.conservative = conservative;
        this.watchAndWait = watchAndWait;
        this.logger = new common_1.Logger(ResponseStrategySelector_1.name);
    }
    selectStrategy(context) {
        const strategy = this.determineStrategy(context.severity, context.assetCriticality);
        this.logger.log(`[ResponseStrategySelector] Selected: ${strategy.getName()} ` +
            `(severity=${context.severity}, criticality=${context.assetCriticality})`);
        return strategy;
    }
    determineStrategy(severity, assetCriticality) {
        if (severity === enums_1.Severity.CRITICAL) {
            if (assetCriticality === 'CRITICAL' || assetCriticality === 'HIGH') {
                return this.aggressive;
            }
            return this.balanced;
        }
        if (severity === enums_1.Severity.HIGH) {
            if (assetCriticality === 'CRITICAL') {
                return this.aggressive;
            }
            if (assetCriticality === 'HIGH') {
                return this.balanced;
            }
            return this.conservative;
        }
        if (severity === enums_1.Severity.MEDIUM) {
            if (assetCriticality === 'CRITICAL') {
                return this.balanced;
            }
            return this.conservative;
        }
        return this.watchAndWait;
    }
    getAllStrategies() {
        return [this.aggressive, this.balanced, this.conservative, this.watchAndWait];
    }
};
exports.ResponseStrategySelector = ResponseStrategySelector;
exports.ResponseStrategySelector = ResponseStrategySelector = ResponseStrategySelector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [aggressive_containment_strategy_1.AggressiveContainmentStrategy,
        balanced_response_strategy_1.BalancedResponseStrategy,
        conservative_strategy_1.ConservativeStrategy,
        watch_and_wait_strategy_1.WatchAndWaitStrategy])
], ResponseStrategySelector);
//# sourceMappingURL=response-strategy.selector.js.map