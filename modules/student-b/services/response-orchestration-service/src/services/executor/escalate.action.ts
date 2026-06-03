// services/response-orchestration-service/src/services/executor/escalate.action.ts
// PATTERN: Factory Method (concrete product)
// Escalates the incident to a Tier-3 analyst via PagerDuty / notification service.

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ResponseAction } from './response-action.interface';
import { ResponseActionType, ResponseActionStatus } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class EscalateAction implements ResponseAction {
  private readonly logger = new Logger(EscalateAction.name);

  getType(): ResponseActionType { return ResponseActionType.ESCALATE; }
  isReversible(): boolean { return false; } // Escalations cannot be rolled back
  describe(): string { return 'Escalate incident to Tier-3 analyst via PagerDuty'; }

  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const escalationTarget = target.metadata?.escalationGroup as string ?? 'tier-3-soc';

    this.logger.log(`[EscalateAction] Escalating to: ${escalationTarget}`);

    try {
      // In production: call PagerDuty Events API v2 or notification-service
      await new Promise((resolve) => setTimeout(resolve, 40));

      const incidentKey = `INC-${actionId.slice(0, 8).toUpperCase()}`;
      this.logger.log(`[EscalateAction] Escalation ticket created: ${incidentKey}`);

      return {
        actionId, actionType: ResponseActionType.ESCALATE,
        status: ResponseActionStatus.SUCCESS, success: true,
        message: `Incident escalated to ${escalationTarget}. Ticket: ${incidentKey}`,
        executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        metadata: {
          escalationGroup: escalationTarget,
          incidentKey,
          pagerDutyEventId: `PD-${uuidv4().slice(0, 8)}`,
        },
      };
    } catch (err) {
      return {
        actionId, actionType: ResponseActionType.ESCALATE,
        status: ResponseActionStatus.FAILED, success: false,
        message: `Failed to escalate: ${(err as Error).message}`,
        executedAt: new Date().toISOString(),
      };
    }
  }

  async rollback(_context: RollbackContext): Promise<ActionOutcome> {
    // Escalations are not reversible — return a failure with clear message
    return {
      actionId: uuidv4(), actionType: ResponseActionType.ESCALATE,
      status: ResponseActionStatus.FAILED, success: false,
      message: 'EscalateAction is not reversible. Escalations cannot be rolled back.',
      executedAt: new Date().toISOString(),
    };
  }
}
