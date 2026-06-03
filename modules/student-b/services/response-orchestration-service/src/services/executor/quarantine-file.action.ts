// services/response-orchestration-service/src/services/executor/quarantine-file.action.ts
// PATTERN: Factory Method (concrete product)
// Quarantines a suspicious file via EDR.

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ResponseAction } from './response-action.interface';
import { ResponseActionType, ResponseActionStatus } from '../../../../../shared/contracts/enums';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

@Injectable()
export class QuarantineFileAction implements ResponseAction {
  private readonly logger = new Logger(QuarantineFileAction.name);

  getType(): ResponseActionType { return ResponseActionType.QUARANTINE_FILE; }
  isReversible(): boolean { return true; }
  describe(): string { return 'Quarantine malicious file via EDR'; }

  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const filePath = target.filePath ?? target.fileHash;

    if (!filePath) {
      return {
        actionId, actionType: ResponseActionType.QUARANTINE_FILE,
        status: ResponseActionStatus.FAILED, success: false,
        message: 'QuarantineFileAction requires filePath or fileHash on target asset',
        executedAt: new Date().toISOString(),
      };
    }

    this.logger.log(`[QuarantineFileAction] Quarantining: ${filePath}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 70));

      const rollbackContext: RollbackContext = {
        snapshotId: uuidv4(),
        previousState: { filePath, fileHash: target.fileHash, originalLocation: filePath },
        rollbackInstructions: `Restore file ${filePath} from EDR quarantine vault`,
        canAutoRollback: true,
      };

      this.logger.log(`[QuarantineFileAction] File quarantined: ${filePath}`);
      return {
        actionId, actionType: ResponseActionType.QUARANTINE_FILE,
        status: ResponseActionStatus.SUCCESS, success: true,
        message: `File ${filePath} has been quarantined`,
        executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        rollbackContext,
        metadata: { quarantinedPath: filePath, quarantineId: `Q-${actionId.slice(0, 8)}` },
      };
    } catch (err) {
      return {
        actionId, actionType: ResponseActionType.QUARANTINE_FILE,
        status: ResponseActionStatus.FAILED, success: false,
        message: `Failed to quarantine ${filePath}: ${(err as Error).message}`,
        executedAt: new Date().toISOString(),
      };
    }
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const filePath = (context.previousState?.filePath as string) ?? 'unknown';
    this.logger.log(`[QuarantineFileAction] Restoring from quarantine: ${filePath}`);
    await new Promise((resolve) => setTimeout(resolve, 70));
    return {
      actionId, actionType: ResponseActionType.QUARANTINE_FILE,
      status: ResponseActionStatus.ROLLED_BACK, success: true,
      message: `File ${filePath} restored from quarantine`,
      executedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    };
  }
}
