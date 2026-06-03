// services/response-orchestration-service/src/services/executor/block-ip.action.ts
// PATTERN: Factory Method (this is a concrete product created by ResponseActionFactory)
// Executes a firewall block rule against the specified IP address.

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ResponseAction } from './response-action.interface';
import {
  ResponseActionType,
  ResponseActionStatus,
} from '../../../../../shared/contracts/enums';
import {
  TargetAsset,
  ActionOutcome,
  RollbackContext,
} from '../../../../../shared/contracts/interfaces';

@Injectable()
export class BlockIPAction implements ResponseAction {
  private readonly logger = new Logger(BlockIPAction.name);

  getType(): ResponseActionType {
    return ResponseActionType.BLOCK_IP;
  }

  isReversible(): boolean {
    return true;
  }

  describe(): string {
    return 'Block IP address at firewall/network perimeter layer';
  }

  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const ip = target.ipAddress ?? target.domain;

    if (!ip) {
      return {
        actionId,
        actionType: ResponseActionType.BLOCK_IP,
        status: ResponseActionStatus.FAILED,
        success: false,
        message: 'BlockIPAction requires ipAddress or domain on target asset',
        executedAt: new Date().toISOString(),
      };
    }

    this.logger.log(`[BlockIPAction] Blocking IP: ${ip}`);

    try {
      // In a real deployment this would call Palo Alto / pfSense / AWS Security Group API.
      // Here we simulate a successful block with a rollback snapshot.
      await this.simulateFirewallApiCall(ip, 'BLOCK');

      const rollbackContext: RollbackContext = {
        snapshotId: uuidv4(),
        previousState: { ip, ruleAction: 'ALLOW' },
        rollbackInstructions: `Remove block rule for ${ip} and restore ALLOW rule`,
        canAutoRollback: true,
      };

      this.logger.log(`[BlockIPAction] Successfully blocked ${ip}`);

      return {
        actionId,
        actionType: ResponseActionType.BLOCK_IP,
        status: ResponseActionStatus.SUCCESS,
        success: true,
        message: `IP ${ip} has been blocked at the network perimeter`,
        executedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        rollbackContext,
        metadata: { blockedIp: ip, ruleId: `rule-${actionId.slice(0, 8)}` },
      };
    } catch (err) {
      this.logger.error(`[BlockIPAction] Failed to block ${ip}: ${(err as Error).message}`);
      return {
        actionId,
        actionType: ResponseActionType.BLOCK_IP,
        status: ResponseActionStatus.FAILED,
        success: false,
        message: `Failed to block IP ${ip}: ${(err as Error).message}`,
        executedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
    }
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    const actionId = uuidv4();
    const ip = (context.previousState?.ip as string) ?? 'unknown';

    this.logger.log(`[BlockIPAction] Rolling back block for IP: ${ip}`);

    try {
      await this.simulateFirewallApiCall(ip, 'ALLOW');

      return {
        actionId,
        actionType: ResponseActionType.BLOCK_IP,
        status: ResponseActionStatus.ROLLED_BACK,
        success: true,
        message: `IP ${ip} block has been removed. ALLOW rule restored.`,
        executedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        metadata: { restoredIp: ip, snapshotId: context.snapshotId },
      };
    } catch (err) {
      return {
        actionId,
        actionType: ResponseActionType.BLOCK_IP,
        status: ResponseActionStatus.FAILED,
        success: false,
        message: `Rollback failed for IP ${ip}: ${(err as Error).message}`,
        executedAt: new Date().toISOString(),
      };
    }
  }

  // Simulates a firewall API call — replace with real integration
  private async simulateFirewallApiCall(ip: string, action: 'BLOCK' | 'ALLOW'): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.logger.debug(`[BlockIPAction] Firewall API: ${action} ${ip} → OK`);
  }
}
