// services/response-orchestration-service/src/services/strategy/watch-and-wait.strategy.ts
// PATTERN: Strategy (Concrete Strategy)
// Watch and wait: take no automated action. Only escalate for human review.
// Use for LOW severity, informational alerts, or when business context
// dictates that automated actions could cause more harm than the threat.

import { Injectable } from '@nestjs/common';
import { ResponseStrategy, ResponsePlan } from './response-strategy.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class WatchAndWaitStrategy implements ResponseStrategy {
  getName(): string {
    return 'WatchAndWaitStrategy';
  }

  getDescription(): string {
    return (
      'No automated containment actions. Escalates to analyst for manual decision. ' +
      'Appropriate for LOW/INFORMATIONAL severity, suspected false positives, ' +
      'or incidents where automated actions carry unacceptable business risk.'
    );
  }

  // PATTERN: Strategy — concrete algorithm for watch-and-wait response
  determineActions(context: ResponseContext): ResponsePlan {
    // Only action: escalate to a human
    const actions: ResponseActionType[] = [ResponseActionType.ESCALATE];

    return {
      strategyName: this.getName(),
      actionTypes: actions,
      requiresApproval: false,
      autoRollbackOnFailure: false,
      rationale:
        `Watch-and-wait strategy selected: severity=${context.severity}, ` +
        `assetCriticality=${context.assetCriticality}. ` +
        `Deferring containment decision to SOC analyst. No automated actions taken.`,
    };
  }
}
