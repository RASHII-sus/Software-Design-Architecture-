// services/response-orchestration-service/src/services/executor/disable-user.action.ts
// PATTERN: Factory Method (concrete product)
// Disables a user account in Active Directory / Identity Provider.

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ResponseAction } from './response-action.interface';
import { ResponseActionType, ResponseActionStatus } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class DisableUserAction implements ResponseAction {
  private readonly logger = new Logger(DisableUserAction.name);

  getType(): ResponseActionType { return ResponseActionType.DISABLE_USER; }
  isReversible(): boolean { return true; }
  describe(): string { return 'Disable user account in Active Directory / IdP'; }

  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const userId = target.userId;

    if (!userId) {
      return {
        actionId, actionType: ResponseActionType.DISABLE_USER,
        status: ResponseActionStatus.FAILED, success: false,
        message: 'DisableUserAction requires userId on target asset',
        executedAt: new Date().toISOString(),
      };
    }

    this.logger.log(`[DisableUserAction] Disabling user account: ${userId}`);

    try {
      // Simulate AD / Okta / Azure AD API call
      await new Promise((resolve) => setTimeout(resolve, 60));

      const rollbackContext: RollbackContext = {
        snapshotId: uuidv4(),
        previousState: { userId, accountStatus: 'ENABLED', groupMemberships: [] },
        rollbackInstructions: `Re-enable account ${userId} in Active Directory`,
        canAutoRollback: true,
      };

      this.logger.log(`[DisableUserAction] User account ${userId} disabled`);
      return {
        actionId, actionType: ResponseActionType.DISABLE_USER,
        status: ResponseActionStatus.SUCCESS, success: true,
        message: `User account ${userId} has been disabled`,
        executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        rollbackContext,
        metadata: { disabledUserId: userId, ticketId: `AD-${actionId.slice(0, 8)}` },
      };
    } catch (err) {
      return {
        actionId, actionType: ResponseActionType.DISABLE_USER,
        status: ResponseActionStatus.FAILED, success: false,
        message: `Failed to disable user ${userId}: ${(err as Error).message}`,
        executedAt: new Date().toISOString(),
      };
    }
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const userId = (context.previousState?.userId as string) ?? 'unknown';
    this.logger.log(`[DisableUserAction] Re-enabling user: ${userId}`);
    await new Promise((resolve) => setTimeout(resolve, 60));
    return {
      actionId, actionType: ResponseActionType.DISABLE_USER,
      status: ResponseActionStatus.ROLLED_BACK, success: true,
      message: `User account ${userId} has been re-enabled`,
      executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    };
  }
}
