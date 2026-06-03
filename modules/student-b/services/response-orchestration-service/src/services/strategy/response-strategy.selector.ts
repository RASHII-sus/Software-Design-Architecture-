// services/response-orchestration-service/src/services/strategy/response-strategy.selector.ts
// PATTERN: Strategy
// Selects the appropriate ResponseStrategy based on incident severity and
// asset criticality. The Facade delegates to this selector — the selection
// algorithm itself is a policy that can be modified independently.

import { Injectable, Logger } from '@nestjs/common';
import { ResponseStrategy } from './response-strategy.interface';
import { AggressiveContainmentStrategy } from './aggressive-containment.strategy';
import { BalancedResponseStrategy } from './balanced-response.strategy';
import { ConservativeStrategy } from './conservative.strategy';
import { WatchAndWaitStrategy } from './watch-and-wait.strategy';
import { Severity } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';

type CriticalityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

@Injectable()
export class ResponseStrategySelector {
  private readonly logger = new Logger(ResponseStrategySelector.name);

  constructor(
    // All strategies injected by DI — selector doesn't construct them
    private readonly aggressive: AggressiveContainmentStrategy,
    private readonly balanced: BalancedResponseStrategy,
    private readonly conservative: ConservativeStrategy,
    private readonly watchAndWait: WatchAndWaitStrategy,
  ) {}

  // PATTERN: Strategy — pure algorithm for selecting the right strategy
  selectStrategy(context: ResponseContext): ResponseStrategy {
    const strategy = this.determineStrategy(context.severity, context.assetCriticality);

    this.logger.log(
      `[ResponseStrategySelector] Selected: ${strategy.getName()} ` +
        `(severity=${context.severity}, criticality=${context.assetCriticality})`,
    );

    return strategy;
  }

  private determineStrategy(
    severity: Severity,
    assetCriticality: CriticalityLevel,
  ): ResponseStrategy {
    // Decision matrix: severity × criticality → strategy
    if (severity === Severity.CRITICAL) {
      if (assetCriticality === 'CRITICAL' || assetCriticality === 'HIGH') {
        return this.aggressive;
      }
      return this.balanced;
    }

    if (severity === Severity.HIGH) {
      if (assetCriticality === 'CRITICAL') {
        return this.aggressive;
      }
      if (assetCriticality === 'HIGH') {
        return this.balanced;
      }
      return this.conservative;
    }

    if (severity === Severity.MEDIUM) {
      if (assetCriticality === 'CRITICAL') {
        return this.balanced;
      }
      return this.conservative;
    }

    // LOW / INFORMATIONAL → watch and wait regardless of criticality
    return this.watchAndWait;
  }

  getAllStrategies(): ResponseStrategy[] {
    return [this.aggressive, this.balanced, this.conservative, this.watchAndWait];
  }
}
