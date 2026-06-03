// services/response-orchestration-service/src/services/executor/response-action.interface.ts
// PATTERN: Factory Method + Decorator
// Defines the canonical interface that all response actions and decorators
// must implement. The Factory creates implementations; Decorators wrap them.

import {
  ResponseActionType,
  ResponseActionStatus,
} from '../../../../../shared/contracts/enums';
import {
  TargetAsset,
  ActionOutcome,
  RollbackContext,
} from '../../../../../shared/contracts/interfaces';

export interface ResponseAction {
  /**
   * Execute the response action against the target asset.
   * Returns an ActionOutcome describing what happened.
   */
  execute(target: TargetAsset): Promise<ActionOutcome>;

  /**
   * Attempt to undo the action using the stored rollback context.
   * Not all actions are reversible.
   */
  rollback(context: RollbackContext): Promise<ActionOutcome>;

  /**
   * Returns the type enum for this action (used by Factory and logging).
   */
  getType(): ResponseActionType;

  /**
   * Returns true if this action supports automatic rollback.
   */
  isReversible(): boolean;

  /**
   * Returns a human-readable description of what this action does.
   */
  describe(): string;
}

export const RESPONSE_ACTION = 'RESPONSE_ACTION';
