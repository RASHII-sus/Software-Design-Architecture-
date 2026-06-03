// services/response-orchestration-service/src/services/decorator/approval-gate.decorator.ts
// PATTERN: Decorator (ApprovalGateDecorator)
// Blocks execution of the wrapped action until an approval decision has been
// recorded. If approval is not pre-granted, throws an error that the Facade
// catches and routes to the approval workflow.

import { ForbiddenException } from '@nestjs/common';
import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';
import { ResponseActionStatus } from '../../../../../shared/contracts/enums';

export class ApprovalGateDecorator extends ResponseActionDecorator {
  private approved = false;
  private approvedBy: string | undefined;
  private approvedAt: Date | undefined;

  constructor(
    wrappedAction: ResponseAction,
    private readonly requiresApproval: boolean,
  ) {
    super(wrappedAction);
  }

  // PATTERN: Decorator — adds approval gate before delegating to wrapped action
  async execute(target: TargetAsset): Promise<ActionOutcome> {
    if (this.requiresApproval && !this.approved) {
      this.logger.warn(
        `[ApprovalGateDecorator] Execution BLOCKED — action=${this.getType()} requires approval`,
      );
      // Return a PENDING outcome rather than throwing — Facade handles this
      return {
        actionId: `pending-${Date.now()}`,
        actionType: this.getType(),
        status: ResponseActionStatus.PENDING,
        success: false,
        message: `Action ${this.getType()} is pending approval before execution`,
        executedAt: new Date().toISOString(),
        metadata: { requiresApproval: true, approvalStatus: 'PENDING' },
      };
    }

    if (this.approved) {
      this.logger.log(
        `[ApprovalGateDecorator] Approval GRANTED by ${this.approvedBy ?? 'system'} ` +
          `at ${this.approvedAt?.toISOString()} — proceeding with ${this.getType()}`,
      );
    }

    return this.wrappedAction.execute(target);
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    // Rollbacks do not require approval — bypass the gate
    return this.wrappedAction.rollback(context);
  }

  /**
   * Called by the ApprovalService to grant execution permission.
   */
  grant(approvedBy: string): void {
    this.approved = true;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.logger.log(
      `[ApprovalGateDecorator] Approval granted for ${this.getType()} by ${approvedBy}`,
    );
  }

  isApproved(): boolean {
    return this.approved;
  }
}
