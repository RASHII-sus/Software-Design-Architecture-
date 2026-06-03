// services/response-orchestration-service/src/services/strategy/aggressive-containment.strategy.ts
// PATTERN: Strategy (Concrete Strategy)
// Aggressive containment: isolate immediately, block IPs, disable users.
// Used for CRITICAL severity + HIGH/CRITICAL asset criticality.
// Accepts higher blast radius to guarantee containment speed.

import { Injectable } from '@nestjs/common';
import { ResponseStrategy, ResponsePlan } from './response-strategy.interface';
import { ResponseActionType, Severity } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class AggressiveContainmentStrategy implements ResponseStrategy {
  getName(): string {
    return 'AggressiveContainmentStrategy';
  }

  getDescription(): string {
    return (
      'Maximum containment speed. Isolates endpoint, blocks IPs, disables ' +
      'user accounts, and quarantines files simultaneously. Requires approval ' +
      'for user account actions. Use for CRITICAL incidents on high-value assets.'
    );
  }

  // PATTERN: Strategy — concrete algorithm for aggressive response
  determineActions(context: ResponseContext): ResponsePlan {
    const actions: ResponseActionType[] = [
      ResponseActionType.ISOLATE_ENDPOINT,   // Cut off the machine immediately
      ResponseActionType.BLOCK_IP,           // Block the attacker's source IP
      ResponseActionType.QUARANTINE_FILE,    // Quarantine any malicious files
    ];

    // Disable user account only if privilege level suggests account compromise
    if (
      context.severity === Severity.CRITICAL ||
      context.assetCriticality === 'CRITICAL'
    ) {
      actions.push(ResponseActionType.DISABLE_USER);
      actions.push(ResponseActionType.ESCALATE);  // Always escalate critical incidents
    }

    return {
      strategyName: this.getName(),
      actionTypes: actions,
      requiresApproval: context.assetCriticality === 'CRITICAL', // extra gate for crown jewels
      autoRollbackOnFailure: true,
      rationale:
        `Aggressive containment selected: severity=${context.severity}, ` +
        `assetCriticality=${context.assetCriticality}. ` +
        `Prioritizing containment speed over service disruption risk.`,
    };
  }
}
