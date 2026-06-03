// services/response-orchestration-service/src/services/decorator/audit-log.decorator.ts
// PATTERN: Decorator (AuditLogDecorator)
// Adds immutable pre-execution and post-execution audit logging to any
// ResponseAction without modifying the action itself.

import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

export class AuditLogDecorator extends ResponseActionDecorator {
  private readonly auditLog: {
    timestamp: string;
    event: string;
    actionType: string;
    target: unknown;
    outcome?: unknown;
  }[] = [];

  constructor(wrappedAction: ResponseAction) {
    super(wrappedAction);
  }

  // PATTERN: Decorator — adds audit logging around the wrapped action's execute
  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const pre = {
      timestamp: new Date().toISOString(),
      event: 'PRE_EXECUTION',
      actionType: this.getType(),
      target,
    };
    this.auditLog.push(pre);
    this.logger.log(
      `[AuditLogDecorator] PRE_EXECUTION — action=${this.getType()}, ` +
        `target=${JSON.stringify({ ip: target.ipAddress, host: target.hostname, user: target.userId })}`,
    );

    const outcome = await this.wrappedAction.execute(target);

    const post = {
      timestamp: new Date().toISOString(),
      event: 'POST_EXECUTION',
      actionType: this.getType(),
      target,
      outcome: { success: outcome.success, status: outcome.status, message: outcome.message },
    };
    this.auditLog.push(post);
    this.logger.log(
      `[AuditLogDecorator] POST_EXECUTION — action=${this.getType()}, ` +
        `success=${outcome.success}, status=${outcome.status}`,
    );

    return outcome;
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    this.logger.log(`[AuditLogDecorator] ROLLBACK_INITIATED — action=${this.getType()}`);
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event: 'ROLLBACK_INITIATED',
      actionType: this.getType(),
      target: context,
    });

    const outcome = await this.wrappedAction.rollback(context);

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event: 'ROLLBACK_COMPLETED',
      actionType: this.getType(),
      target: context,
      outcome: { success: outcome.success, status: outcome.status },
    });

    return outcome;
  }

  getAuditTrail() {
    return [...this.auditLog];
  }
}
