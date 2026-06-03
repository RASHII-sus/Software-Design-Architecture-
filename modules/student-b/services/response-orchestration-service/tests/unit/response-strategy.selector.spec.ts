// services/response-orchestration-service/tests/unit/response-strategy.selector.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ResponseStrategySelector } from '../../src/services/strategy/response-strategy.selector';
import { AggressiveContainmentStrategy } from '../../src/services/strategy/aggressive-containment.strategy';
import { BalancedResponseStrategy } from '../../src/services/strategy/balanced-response.strategy';
import { ConservativeStrategy } from '../../src/services/strategy/conservative.strategy';
import { WatchAndWaitStrategy } from '../../src/services/strategy/watch-and-wait.strategy';
import { Severity, IncidentState } from '../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../shared/contracts/interfaces';

// PATTERN: Strategy — test that the correct strategy is selected per context
describe('ResponseStrategySelector', () => {
  let selector: ResponseStrategySelector;

  const makeContext = (
    severity: Severity,
    assetCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  ): ResponseContext => ({
    incidentId: 'test-incident',
    incidentState: IncidentState.CONTAINMENT,
    severity,
    assetCriticality,
    autoResponse: true,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseStrategySelector,
        AggressiveContainmentStrategy,
        BalancedResponseStrategy,
        ConservativeStrategy,
        WatchAndWaitStrategy,
      ],
    }).compile();

    selector = module.get<ResponseStrategySelector>(ResponseStrategySelector);
  });

  describe('CRITICAL severity', () => {
    it('selects AggressiveContainmentStrategy for CRITICAL/CRITICAL', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.CRITICAL, 'CRITICAL'));
      expect(strategy.getName()).toBe('AggressiveContainmentStrategy');
    });

    it('selects AggressiveContainmentStrategy for CRITICAL/HIGH', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.CRITICAL, 'HIGH'));
      expect(strategy.getName()).toBe('AggressiveContainmentStrategy');
    });

    it('selects BalancedResponseStrategy for CRITICAL/MEDIUM', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.CRITICAL, 'MEDIUM'));
      expect(strategy.getName()).toBe('BalancedResponseStrategy');
    });
  });

  describe('HIGH severity', () => {
    it('selects AggressiveContainmentStrategy for HIGH/CRITICAL', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.HIGH, 'CRITICAL'));
      expect(strategy.getName()).toBe('AggressiveContainmentStrategy');
    });

    it('selects BalancedResponseStrategy for HIGH/HIGH', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.HIGH, 'HIGH'));
      expect(strategy.getName()).toBe('BalancedResponseStrategy');
    });

    it('selects ConservativeStrategy for HIGH/LOW', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.HIGH, 'LOW'));
      expect(strategy.getName()).toBe('ConservativeStrategy');
    });
  });

  describe('MEDIUM severity', () => {
    it('selects BalancedResponseStrategy for MEDIUM/CRITICAL', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.MEDIUM, 'CRITICAL'));
      expect(strategy.getName()).toBe('BalancedResponseStrategy');
    });

    it('selects ConservativeStrategy for MEDIUM/HIGH', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.MEDIUM, 'HIGH'));
      expect(strategy.getName()).toBe('ConservativeStrategy');
    });
  });

  describe('LOW / INFORMATIONAL severity', () => {
    it('selects WatchAndWaitStrategy regardless of criticality', () => {
      const low = selector.selectStrategy(makeContext(Severity.LOW, 'CRITICAL'));
      expect(low.getName()).toBe('WatchAndWaitStrategy');

      const info = selector.selectStrategy(makeContext(Severity.INFORMATIONAL, 'HIGH'));
      expect(info.getName()).toBe('WatchAndWaitStrategy');
    });
  });

  describe('determineActions', () => {
    it('AggressiveContainmentStrategy includes ISOLATE_ENDPOINT and BLOCK_IP', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.CRITICAL, 'CRITICAL'));
      const plan = strategy.determineActions(makeContext(Severity.CRITICAL, 'CRITICAL'));
      expect(plan.actionTypes).toContain('ISOLATE_ENDPOINT');
      expect(plan.actionTypes).toContain('BLOCK_IP');
    });

    it('WatchAndWaitStrategy only escalates', () => {
      const strategy = selector.selectStrategy(makeContext(Severity.LOW, 'LOW'));
      const plan = strategy.determineActions(makeContext(Severity.LOW, 'LOW'));
      expect(plan.actionTypes).toEqual(['ESCALATE']);
    });
  });
});
