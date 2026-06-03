// services/response-orchestration-service/src/services/strategy/response-strategy.interface.ts
// PATTERN: Strategy — defines the interchangeable algorithm interface

import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';

export interface ResponsePlan {
  strategyName: string;
  actionTypes: ResponseActionType[];
  requiresApproval: boolean;
  autoRollbackOnFailure: boolean;
  rationale: string;
}

export interface ResponseStrategy {
  /**
   * Determine which response actions to take given the current incident context.
   * Each strategy implements a different risk/impact trade-off algorithm.
   */
  determineActions(context: ResponseContext): ResponsePlan;

  /**
   * Returns the unique name of this strategy.
   */
  getName(): string;

  /**
   * Returns a description of when this strategy is appropriate.
   */
  getDescription(): string;
}
