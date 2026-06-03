// services/response-orchestration-service/src/services/strategy/conservative.strategy.ts
// PATTERN: Strategy (Concrete Strategy)
// Conservative: block at network level only. No endpoint isolation, no user actions.
// Use for MEDIUM severity or where business continuity risk is high.

import { Injectable } from '@nestjs/common';
import { ResponseStrategy, ResponsePlan } from './response-strategy.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class ConservativeStrategy implements ResponseStrategy {
  getName(): string {
    return 'ConservativeStrategy';
  }

  getDescription(): string {
    return (
      'Minimal disruption response. Only blocks the source IP at network level. ' +
      'Escalates to analyst for further decisions. ' +
      'Use for MEDIUM severity incidents or business-critical production systems.'
    );
  }

  // PATTERN: Strategy — concrete algorithm for conservative response
  determineActions(context: ResponseContext): ResponsePlan {
    const actions: ResponseActionType[] = [
      ResponseActionType.BLOCK_IP,   // Lowest-impact containment available
      ResponseActionType.ESCALATE,   // Always get human eyes on it
    ];

    return {
      strategyName: this.getName(),
      actionTypes: actions,
      requiresApproval: false,
      autoRollbackOnFailure: true,
      rationale:
        `Conservative strategy selected: severity=${context.severity}, ` +
        `assetCriticality=${context.assetCriticality}. ` +
        `Minimizing business disruption while maintaining basic containment.`,
    };
  }
}
