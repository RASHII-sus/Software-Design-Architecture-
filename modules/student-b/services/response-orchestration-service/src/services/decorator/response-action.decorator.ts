// services/response-orchestration-service/src/services/decorator/response-action.decorator.ts
// PATTERN: Decorator — abstract base class
// Wraps a ResponseAction and delegates to it. Concrete decorators extend
// this to add behaviour before/after execution without subclassing the actions.

import { Logger } from '@nestjs/common';
import { ResponseAction } from '../executor/response-action.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

// PATTERN: Decorator — base decorator implements the same interface as component
export abstract class ResponseActionDecorator implements ResponseAction {
  protected readonly logger: Logger;

  constructor(
    // The wrapped action — could be a real action or another decorator
    protected readonly wrappedAction: ResponseAction,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  // Default passthrough — concrete decorators override to add behaviour
  async execute(target: TargetAsset): Promise<ActionOutcome> {
    return this.wrappedAction.execute(target);
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    return this.wrappedAction.rollback(context);
  }

  getType(): ResponseActionType {
    return this.wrappedAction.getType();
  }

  isReversible(): boolean {
    return this.wrappedAction.isReversible();
  }

  describe(): string {
    return this.wrappedAction.describe();
  }
}
