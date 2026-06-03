"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const response_strategy_selector_1 = require("../../src/services/strategy/response-strategy.selector");
const aggressive_containment_strategy_1 = require("../../src/services/strategy/aggressive-containment.strategy");
const balanced_response_strategy_1 = require("../../src/services/strategy/balanced-response.strategy");
const conservative_strategy_1 = require("../../src/services/strategy/conservative.strategy");
const watch_and_wait_strategy_1 = require("../../src/services/strategy/watch-and-wait.strategy");
const enums_1 = require("../../../../shared/contracts/enums");
describe('ResponseStrategySelector', () => {
    let selector;
    const makeContext = (severity, assetCriticality) => ({
        incidentId: 'test-incident',
        incidentState: enums_1.IncidentState.CONTAINMENT,
        severity,
        assetCriticality,
        autoResponse: true,
    });
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                response_strategy_selector_1.ResponseStrategySelector,
                aggressive_containment_strategy_1.AggressiveContainmentStrategy,
                balanced_response_strategy_1.BalancedResponseStrategy,
                conservative_strategy_1.ConservativeStrategy,
                watch_and_wait_strategy_1.WatchAndWaitStrategy,
            ],
        }).compile();
        selector = module.get(response_strategy_selector_1.ResponseStrategySelector);
    });
    describe('CRITICAL severity', () => {
        it('selects AggressiveContainmentStrategy for CRITICAL/CRITICAL', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.CRITICAL, 'CRITICAL'));
            expect(strategy.getName()).toBe('AggressiveContainmentStrategy');
        });
        it('selects AggressiveContainmentStrategy for CRITICAL/HIGH', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.CRITICAL, 'HIGH'));
            expect(strategy.getName()).toBe('AggressiveContainmentStrategy');
        });
        it('selects BalancedResponseStrategy for CRITICAL/MEDIUM', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.CRITICAL, 'MEDIUM'));
            expect(strategy.getName()).toBe('BalancedResponseStrategy');
        });
    });
    describe('HIGH severity', () => {
        it('selects AggressiveContainmentStrategy for HIGH/CRITICAL', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.HIGH, 'CRITICAL'));
            expect(strategy.getName()).toBe('AggressiveContainmentStrategy');
        });
        it('selects BalancedResponseStrategy for HIGH/HIGH', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.HIGH, 'HIGH'));
            expect(strategy.getName()).toBe('BalancedResponseStrategy');
        });
        it('selects ConservativeStrategy for HIGH/LOW', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.HIGH, 'LOW'));
            expect(strategy.getName()).toBe('ConservativeStrategy');
        });
    });
    describe('MEDIUM severity', () => {
        it('selects BalancedResponseStrategy for MEDIUM/CRITICAL', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.MEDIUM, 'CRITICAL'));
            expect(strategy.getName()).toBe('BalancedResponseStrategy');
        });
        it('selects ConservativeStrategy for MEDIUM/HIGH', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.MEDIUM, 'HIGH'));
            expect(strategy.getName()).toBe('ConservativeStrategy');
        });
    });
    describe('LOW / INFORMATIONAL severity', () => {
        it('selects WatchAndWaitStrategy regardless of criticality', () => {
            const low = selector.selectStrategy(makeContext(enums_1.Severity.LOW, 'CRITICAL'));
            expect(low.getName()).toBe('WatchAndWaitStrategy');
            const info = selector.selectStrategy(makeContext(enums_1.Severity.INFORMATIONAL, 'HIGH'));
            expect(info.getName()).toBe('WatchAndWaitStrategy');
        });
    });
    describe('determineActions', () => {
        it('AggressiveContainmentStrategy includes ISOLATE_ENDPOINT and BLOCK_IP', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.CRITICAL, 'CRITICAL'));
            const plan = strategy.determineActions(makeContext(enums_1.Severity.CRITICAL, 'CRITICAL'));
            expect(plan.actionTypes).toContain('ISOLATE_ENDPOINT');
            expect(plan.actionTypes).toContain('BLOCK_IP');
        });
        it('WatchAndWaitStrategy only escalates', () => {
            const strategy = selector.selectStrategy(makeContext(enums_1.Severity.LOW, 'LOW'));
            const plan = strategy.determineActions(makeContext(enums_1.Severity.LOW, 'LOW'));
            expect(plan.actionTypes).toEqual(['ESCALATE']);
        });
    });
});
//# sourceMappingURL=response-strategy.selector.spec.js.map