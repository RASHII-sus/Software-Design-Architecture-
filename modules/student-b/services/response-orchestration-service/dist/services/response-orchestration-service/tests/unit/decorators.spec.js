"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_log_decorator_1 = require("../../src/services/decorator/audit-log.decorator");
const approval_gate_decorator_1 = require("../../src/services/decorator/approval-gate.decorator");
const metrics_decorator_1 = require("../../src/services/decorator/metrics.decorator");
const rollback_decorator_1 = require("../../src/services/decorator/rollback.decorator");
const enums_1 = require("../../../../shared/contracts/enums");
const makeSuccessOutcome = () => ({
    actionId: 'test-action-id',
    actionType: enums_1.ResponseActionType.BLOCK_IP,
    status: enums_1.ResponseActionStatus.SUCCESS,
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
const makeFailureOutcome = () => ({
    actionId: 'test-action-id',
    actionType: enums_1.ResponseActionType.BLOCK_IP,
    status: enums_1.ResponseActionStatus.FAILED,
    success: false,
    message: 'Firewall API unreachable',
    executedAt: new Date().toISOString(),
});
const makeMockAction = (outcome) => ({
    execute: jest.fn().mockResolvedValue(outcome),
    rollback: jest.fn().mockResolvedValue({ ...outcome, status: enums_1.ResponseActionStatus.ROLLED_BACK }),
    getType: jest.fn().mockReturnValue(enums_1.ResponseActionType.BLOCK_IP),
    isReversible: jest.fn().mockReturnValue(true),
    describe: jest.fn().mockReturnValue('Mock block IP action'),
});
const mockTarget = { ipAddress: '1.2.3.4' };
describe('AuditLogDecorator', () => {
    it('delegates execute to wrapped action and returns same outcome', async () => {
        const outcome = makeSuccessOutcome();
        const mock = makeMockAction(outcome);
        const decorator = new audit_log_decorator_1.AuditLogDecorator(mock);
        const result = await decorator.execute(mockTarget);
        expect(result).toEqual(outcome);
        expect(mock.execute).toHaveBeenCalledWith(mockTarget);
    });
    it('records PRE and POST audit log entries on success', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new audit_log_decorator_1.AuditLogDecorator(mock);
        await decorator.execute(mockTarget);
        const trail = decorator.getAuditTrail();
        expect(trail).toHaveLength(2);
        expect(trail[0].event).toBe('PRE_EXECUTION');
        expect(trail[1].event).toBe('POST_EXECUTION');
    });
    it('still records POST_EXECUTION entry even when action fails', async () => {
        const mock = makeMockAction(makeFailureOutcome());
        const decorator = new audit_log_decorator_1.AuditLogDecorator(mock);
        await decorator.execute(mockTarget);
        const trail = decorator.getAuditTrail();
        expect(trail[1].event).toBe('POST_EXECUTION');
        expect(trail[1].outcome.success).toBe(false);
    });
    it('records ROLLBACK events in audit trail', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new audit_log_decorator_1.AuditLogDecorator(mock);
        const ctx = { canAutoRollback: true };
        await decorator.rollback(ctx);
        const trail = decorator.getAuditTrail();
        expect(trail.some((e) => e.event === 'ROLLBACK_INITIATED')).toBe(true);
        expect(trail.some((e) => e.event === 'ROLLBACK_COMPLETED')).toBe(true);
    });
});
describe('ApprovalGateDecorator', () => {
    it('executes immediately when approval is not required', async () => {
        const outcome = makeSuccessOutcome();
        const mock = makeMockAction(outcome);
        const decorator = new approval_gate_decorator_1.ApprovalGateDecorator(mock, false);
        const result = await decorator.execute(mockTarget);
        expect(result).toEqual(outcome);
        expect(mock.execute).toHaveBeenCalledWith(mockTarget);
    });
    it('returns PENDING outcome when approval IS required and not yet granted', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new approval_gate_decorator_1.ApprovalGateDecorator(mock, true);
        const result = await decorator.execute(mockTarget);
        expect(result.status).toBe(enums_1.ResponseActionStatus.PENDING);
        expect(result.success).toBe(false);
        expect(mock.execute).not.toHaveBeenCalled();
    });
    it('executes after approval is granted via grant()', async () => {
        const outcome = makeSuccessOutcome();
        const mock = makeMockAction(outcome);
        const decorator = new approval_gate_decorator_1.ApprovalGateDecorator(mock, true);
        decorator.grant('analyst-007');
        const result = await decorator.execute(mockTarget);
        expect(result).toEqual(outcome);
        expect(mock.execute).toHaveBeenCalled();
        expect(decorator.isApproved()).toBe(true);
    });
    it('bypasses approval gate for rollback operations', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new approval_gate_decorator_1.ApprovalGateDecorator(mock, true);
        const ctx = { canAutoRollback: true };
        await decorator.rollback(ctx);
        expect(mock.rollback).toHaveBeenCalledWith(ctx);
    });
});
describe('MetricsDecorator', () => {
    beforeEach(() => {
        const m = metrics_decorator_1.MetricsDecorator.getMetrics();
        m.length = 0;
    });
    it('delegates to wrapped action and returns same outcome', async () => {
        const outcome = makeSuccessOutcome();
        const mock = makeMockAction(outcome);
        const decorator = new metrics_decorator_1.MetricsDecorator(mock);
        const result = await decorator.execute(mockTarget);
        expect(result).toEqual(outcome);
    });
    it('records metrics after execution', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new metrics_decorator_1.MetricsDecorator(mock);
        await decorator.execute(mockTarget);
        const metrics = metrics_decorator_1.MetricsDecorator.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
        const blockIpMetric = metrics.find((m) => m.actionType === enums_1.ResponseActionType.BLOCK_IP);
        expect(blockIpMetric).toBeDefined();
        expect(blockIpMetric.successCount).toBe(1);
        expect(blockIpMetric.failureCount).toBe(0);
        expect(blockIpMetric.totalExecutions).toBe(1);
        expect(blockIpMetric.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
    it('increments failureCount on failed action', async () => {
        const mock = makeMockAction(makeFailureOutcome());
        const decorator = new metrics_decorator_1.MetricsDecorator(mock);
        await decorator.execute(mockTarget);
        const metrics = metrics_decorator_1.MetricsDecorator.getMetrics();
        const m = metrics.find((m) => m.actionType === enums_1.ResponseActionType.BLOCK_IP);
        expect(m?.failureCount).toBe(1);
        expect(m?.successCount).toBe(0);
    });
});
describe('RollbackDecorator', () => {
    it('delegates execute and returns outcome', async () => {
        const outcome = makeSuccessOutcome();
        const mock = makeMockAction(outcome);
        const decorator = new rollback_decorator_1.RollbackDecorator(mock, true);
        const result = await decorator.execute(mockTarget);
        expect(result).toEqual(outcome);
    });
    it('captures rollback context from successful execution', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new rollback_decorator_1.RollbackDecorator(mock, true);
        await decorator.execute(mockTarget);
        const ctx = decorator.getCapturedRollbackContext();
        expect(ctx).not.toBeNull();
        expect(ctx?.snapshotId).toBe('snap-001');
        expect(ctx?.canAutoRollback).toBe(true);
    });
    it('does not capture rollback context when action fails', async () => {
        const mock = makeMockAction(makeFailureOutcome());
        const decorator = new rollback_decorator_1.RollbackDecorator(mock, true);
        await decorator.execute(mockTarget);
        const ctx = decorator.getCapturedRollbackContext();
        expect(ctx).toBeNull();
    });
    it('uses captured context for rollback when none is provided explicitly', async () => {
        const mock = makeMockAction(makeSuccessOutcome());
        const decorator = new rollback_decorator_1.RollbackDecorator(mock, true);
        await decorator.execute(mockTarget);
        await decorator.rollback(undefined);
        expect(mock.rollback).toHaveBeenCalledWith(expect.objectContaining({ snapshotId: 'snap-001' }));
    });
    it('returns FAILED outcome when no rollback context is available', async () => {
        const mock = makeMockAction(makeFailureOutcome());
        const decorator = new rollback_decorator_1.RollbackDecorator(mock, true);
        const result = await decorator.rollback(undefined);
        expect(result.success).toBe(false);
        expect(result.message).toContain('no rollback context');
    });
});
//# sourceMappingURL=decorators.spec.js.map