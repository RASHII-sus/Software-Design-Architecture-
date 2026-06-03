// services/response-orchestration-service/src/services/strategy/balanced-response.strategy.ts
// PATTERN: Strategy (Concrete Strategy)
// Balanced: block IPs and quarantine files but preserve endpoint connectivity
// unless confirmed compromise. Use for HIGH severity incidents.

import { Injectable } from '@nestjs/common';
import { ResponseStrategy, ResponsePlan } from './response-strategy.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class BalancedResponseStrategy implements ResponseStrategy {
  getName(): string {
    return 'BalancedResponseStrategy';
  }

  getDescription(): string {
    return (
      'Balanced risk/impact response. Blocks network indicators and quarantines ' +
      'files but avoids full endpoint isolation. Escalates for human review. ' +
      'Use for HIGH severity incidents on MEDIUM/HIGH criticality assets.'
    );
  }

  // PATTERN: Strategy — concrete algorithm for balanced response
  determineActions(context: ResponseContext): ResponsePlan {
    const actions: ResponseActionType[] = [
      ResponseActionType.BLOCK_IP,
      ResponseActionType.QUARANTINE_FILE,
    ];

    // Only escalate — let the analyst decide on endpoint isolation
    if (context.assetCriticality === 'HIGH' || context.assetCriticality === 'CRITICAL') {
      actions.push(ResponseActionType.ESCALATE);
    }

    return {
      strategyName: this.getName(),
      actionTypes: actions,
      requiresApproval: false,
      autoRollbackOnFailure: true,
      rationale:
        `Balanced strategy selected: severity=${context.severity}, ` +
        `assetCriticality=${context.assetCriticality}. ` +
        `Containing network vector while preserving endpoint availability.`,
    };
  }
}
