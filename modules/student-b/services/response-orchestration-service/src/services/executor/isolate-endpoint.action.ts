// services/response-orchestration-service/src/services/executor/isolate-endpoint.action.ts
// PATTERN: Factory Method (concrete product)
// Isolates an endpoint by triggering EDR quarantine mode.

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ResponseAction } from './response-action.interface';
import { ResponseActionType, ResponseActionStatus } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class IsolateEndpointAction implements ResponseAction {
  private readonly logger = new Logger(IsolateEndpointAction.name);

  getType(): ResponseActionType { return ResponseActionType.ISOLATE_ENDPOINT; }
  isReversible(): boolean { return true; }
  describe(): string { return 'Isolate endpoint via EDR (network quarantine mode)'; }

  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const hostname = target.hostname ?? target.assetId;

    if (!hostname) {
      return {
        actionId, actionType: ResponseActionType.ISOLATE_ENDPOINT,
        status: ResponseActionStatus.FAILED, success: false,
        message: 'IsolateEndpointAction requires hostname or assetId',
        executedAt: new Date().toISOString(),
      };
    }

    this.logger.log(`[IsolateEndpointAction] Isolating endpoint: ${hostname}`);

    try {
      // Simulate CrowdStrike / SentinelOne EDR isolation API call
      await new Promise((resolve) => setTimeout(resolve, 80));

      const rollbackContext: RollbackContext = {
        snapshotId: uuidv4(),
        previousState: { hostname, networkStatus: 'CONNECTED' },
        rollbackInstructions: `Lift network isolation for ${hostname} via EDR console`,
        canAutoRollback: true,
      };

      this.logger.log(`[IsolateEndpointAction] Endpoint ${hostname} isolated`);
      return {
        actionId, actionType: ResponseActionType.ISOLATE_ENDPOINT,
        status: ResponseActionStatus.SUCCESS, success: true,
        message: `Endpoint ${hostname} has been isolated from the network`,
        executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        rollbackContext,
        metadata: { isolatedHost: hostname, edrJobId: `edr-${actionId.slice(0, 8)}` },
      };
    } catch (err) {
      return {
        actionId, actionType: ResponseActionType.ISOLATE_ENDPOINT,
        status: ResponseActionStatus.FAILED, success: false,
        message: `Failed to isolate ${hostname}: ${(err as Error).message}`,
        executedAt: new Date().toISOString(),
      };
    }
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const hostname = (context.previousState?.hostname as string) ?? 'unknown';
    this.logger.log(`[IsolateEndpointAction] Lifting isolation for: ${hostname}`);
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      actionId, actionType: ResponseActionType.ISOLATE_ENDPOINT,
      status: ResponseActionStatus.ROLLED_BACK, success: true,
      message: `Network isolation lifted for ${hostname}`,
      executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    };
  }
}
