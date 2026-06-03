// services/response-orchestration-service/tests/unit/decorators.spec.ts
// PATTERN: Decorator — verify each decorator adds its behaviour without
// altering the underlying action's result.

import { AuditLogDecorator } from '../../src/services/decorator/audit-log.decorator';
import { ApprovalGateDecorator } from '../../src/services/decorator/approval-gate.decorator';
import { MetricsDecorator } from '../../src/services/decorator/metrics.decorator';
import { RollbackDecorator } from '../../src/services/decorator/rollback.decorator';
import { ResponseAction } from '../../src/services/executor/response-action.interface';
import {
  ResponseActionType,
  ResponseActionStatus,
} from '../../../../shared/contracts/enums';
import {
  TargetAsset,
  ActionOutcome,
  RollbackContext,
} from '../../../../shared/contracts/interfaces';

// ─── Shared mock action ───────────────────────────────────────────────────────
const makeSuccessOutcome = (): ActionOutcome => ({
  actionId: 'test-action-id',
  actionType: ResponseActionType.BLOCK_IP,
  status: ResponseActionStatus.SUCCESS,
  success: true,
  message: 'IP blocked successfully',
  executedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  rollbackContext: {
    snapshotId: 'snap-001',
    previousState: { ip: '1.2.3.4', ruleAction: 'ALLOW' },
    rollbackInstructions: 'Remove block rule',
    canAutoRollback: true,
  },
});

const makeFailureOutcome = (): ActionOutcome => ({
  actionId: 'test-action-id',
  actionType: ResponseActionType.BLOCK_IP,
  status: ResponseActionStatus.FAILED,
  success: false,
  message: 'Firewall API unreachable',
  executedAt: new Date().toISOString(),
});

const makeMockAction = (outcome: ActionOutcome): jest.Mocked<ResponseAction> => ({
  execute: jest.fn().mockResolvedValue(outcome),
  rollback: jest.fn().mockResolvedValue({ ...outcome, status: ResponseActionStatus.ROLLED_BACK }),
  getType: jest.fn().mockReturnValue(ResponseActionType.BLOCK_IP),
  isReversible: jest.fn().mockReturnValue(true),
  describe: jest.fn().mockReturnValue('Mock block IP action'),
});

const mockTarget: TargetAsset = { ipAddress: '1.2.3.4' };

// ─── AuditLogDecorator tests ──────────────────────────────────────────────────
describe('AuditLogDecorator', () => {
  it('delegates execute to wrapped action and returns same outcome', async () => {
    const outcome = makeSuccessOutcome();
    const mock = makeMockAction(outcome);
    const decorator = new AuditLogDecorator(mock);

    const result = await decorator.execute(mockTarget);

    expect(result).toEqual(outcome);
    expect(mock.execute).toHaveBeenCalledWith(mockTarget);
  });

  it('records PRE and POST audit log entries on success', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new AuditLogDecorator(mock);

    await decorator.execute(mockTarget);
    const trail = decorator.getAuditTrail();

    expect(trail).toHaveLength(2);
    expect(trail[0].event).toBe('PRE_EXECUTION');
    expect(trail[1].event).toBe('POST_EXECUTION');
  });

  it('still records POST_EXECUTION entry even when action fails', async () => {
    const mock = makeMockAction(makeFailureOutcome());
    const decorator = new AuditLogDecorator(mock);

    await decorator.execute(mockTarget);
    const trail = decorator.getAuditTrail();

    expect(trail[1].event).toBe('POST_EXECUTION');
    expect((trail[1].outcome as Record<string, unknown>).success).toBe(false);
  });

  it('records ROLLBACK events in audit trail', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new AuditLogDecorator(mock);
    const ctx: RollbackContext = { canAutoRollback: true };

    await decorator.rollback(ctx);
    const trail = decorator.getAuditTrail();

    expect(trail.some((e) => e.event === 'ROLLBACK_INITIATED')).toBe(true);
    expect(trail.some((e) => e.event === 'ROLLBACK_COMPLETED')).toBe(true);
  });
});

// ─── ApprovalGateDecorator tests ─────────────────────────────────────────────
describe('ApprovalGateDecorator', () => {
  it('executes immediately when approval is not required', async () => {
    const outcome = makeSuccessOutcome();
    const mock = makeMockAction(outcome);
    const decorator = new ApprovalGateDecorator(mock, false);

    const result = await decorator.execute(mockTarget);

    expect(result).toEqual(outcome);
    expect(mock.execute).toHaveBeenCalledWith(mockTarget);
  });

  it('returns PENDING outcome when approval IS required and not yet granted', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new ApprovalGateDecorator(mock, true);

    const result = await decorator.execute(mockTarget);

    expect(result.status).toBe(ResponseActionStatus.PENDING);
    expect(result.success).toBe(false);
    expect(mock.execute).not.toHaveBeenCalled();
  });

  it('executes after approval is granted via grant()', async () => {
    const outcome = makeSuccessOutcome();
    const mock = makeMockAction(outcome);
    const decorator = new ApprovalGateDecorator(mock, true);

    decorator.grant('analyst-007');
    const result = await decorator.execute(mockTarget);

    expect(result).toEqual(outcome);
    expect(mock.execute).toHaveBeenCalled();
    expect(decorator.isApproved()).toBe(true);
  });

  it('bypasses approval gate for rollback operations', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new ApprovalGateDecorator(mock, true); // requires approval but NOT granted
    const ctx: RollbackContext = { canAutoRollback: true };

    await decorator.rollback(ctx);

    // Rollback should bypass approval gate
    expect(mock.rollback).toHaveBeenCalledWith(ctx);
  });
});

// ─── MetricsDecorator tests ───────────────────────────────────────────────────
describe('MetricsDecorator', () => {
  beforeEach(() => {
    // Clear static metrics between tests
    const m = MetricsDecorator.getMetrics();
    m.length = 0;
  });

  it('delegates to wrapped action and returns same outcome', async () => {
    const outcome = makeSuccessOutcome();
    const mock = makeMockAction(outcome);
    const decorator = new MetricsDecorator(mock);

    const result = await decorator.execute(mockTarget);
    expect(result).toEqual(outcome);
  });

  it('records metrics after execution', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new MetricsDecorator(mock);

    await decorator.execute(mockTarget);
    const metrics = MetricsDecorator.getMetrics();

    expect(metrics.length).toBeGreaterThan(0);
    const blockIpMetric = metrics.find((m) => m.actionType === ResponseActionType.BLOCK_IP);
    expect(blockIpMetric).toBeDefined();
    expect(blockIpMetric!.successCount).toBe(1);
    expect(blockIpMetric!.failureCount).toBe(0);
    expect(blockIpMetric!.totalExecutions).toBe(1);
    expect(blockIpMetric!.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('increments failureCount on failed action', async () => {
    const mock = makeMockAction(makeFailureOutcome());
    const decorator = new MetricsDecorator(mock);

    await decorator.execute(mockTarget);
    const metrics = MetricsDecorator.getMetrics();
    const m = metrics.find((m) => m.actionType === ResponseActionType.BLOCK_IP);

    expect(m?.failureCount).toBe(1);
    expect(m?.successCount).toBe(0);
  });
});

// ─── RollbackDecorator tests ──────────────────────────────────────────────────
describe('RollbackDecorator', () => {
  it('delegates execute and returns outcome', async () => {
    const outcome = makeSuccessOutcome();
    const mock = makeMockAction(outcome);
    const decorator = new RollbackDecorator(mock, true);

    const result = await decorator.execute(mockTarget);
    expect(result).toEqual(outcome);
  });

  it('captures rollback context from successful execution', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new RollbackDecorator(mock, true);

    await decorator.execute(mockTarget);
    const ctx = decorator.getCapturedRollbackContext();

    expect(ctx).not.toBeNull();
    expect(ctx?.snapshotId).toBe('snap-001');
    expect(ctx?.canAutoRollback).toBe(true);
  });

  it('does not capture rollback context when action fails', async () => {
    const mock = makeMockAction(makeFailureOutcome());
    const decorator = new RollbackDecorator(mock, true);

    await decorator.execute(mockTarget);
    const ctx = decorator.getCapturedRollbackContext();

    expect(ctx).toBeNull();
  });

  it('uses captured context for rollback when none is provided explicitly', async () => {
    const mock = makeMockAction(makeSuccessOutcome());
    const decorator = new RollbackDecorator(mock, true);

    // Execute first to capture context
    await decorator.execute(mockTarget);
    // Rollback without passing context explicitly
    await decorator.rollback(undefined as unknown as RollbackContext);

    expect(mock.rollback).toHaveBeenCalledWith(
      expect.objectContaining({ snapshotId: 'snap-001' }),
    );
  });

  it('returns FAILED outcome when no rollback context is available', async () => {
    const mock = makeMockAction(makeFailureOutcome());
    const decorator = new RollbackDecorator(mock, true);
    // No execute called — no context captured
    const result = await decorator.rollback(undefined as unknown as RollbackContext);

    expect(result.success).toBe(false);
    expect(result.message).toContain('no rollback context');
  });
});
