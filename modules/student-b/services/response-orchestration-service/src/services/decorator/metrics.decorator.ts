// services/response-orchestration-service/src/services/decorator/metrics.decorator.ts
// PATTERN: Decorator (MetricsDecorator)
// Records execution time, success/failure counts, and publishes metrics
// for the action without touching the action implementation itself.

import { ResponseActionDecorator } from './response-action.decorator';
import { ResponseAction } from '../executor/response-action.interface';
import { TargetAsset, ActionOutcome, RollbackContext } from '../../../../../shared/contracts/interfaces';

interface ActionMetrics {
  actionType: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  totalDurationMs: number;
  lastExecutedAt?: string;
}

// In-process metrics store — in production, publish to Prometheus/StatsD
const metricsStore = new Map<string, ActionMetrics>();

export class MetricsDecorator extends ResponseActionDecorator {
  constructor(wrappedAction: ResponseAction) {
    super(wrappedAction);
  }

  // PATTERN: Decorator — wraps execute to record timing and outcome metrics
  async execute(target: TargetAsset): Promise<ActionOutcome> {
    const startMs = Date.now();
    const actionType = this.getType();

    let outcome: ActionOutcome;
    try {
      outcome = await this.wrappedAction.execute(target);
    } finally {
      const durationMs = Date.now() - startMs;
      this.recordMetric(actionType, outcome! ?? null, durationMs);
      this.logger.debug(
        `[MetricsDecorator] ${actionType} completed in ${durationMs}ms` +
          (outcome! ? ` — success=${outcome.success}` : ''),
      );
    }

    return outcome!;
  }

  async rollback(context: RollbackContext): Promise<ActionOutcome> {
    const startMs = Date.now();
    const outcome = await this.wrappedAction.rollback(context);
    const durationMs = Date.now() - startMs;
    this.logger.debug(
      `[MetricsDecorator] Rollback ${this.getType()} completed in ${durationMs}ms`,
    );
    return outcome;
  }

  private recordMetric(
    actionType: string,
    outcome: ActionOutcome | null,
    durationMs: number,
  ): void {
    const existing = metricsStore.get(actionType) ?? {
      actionType,
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      totalDurationMs: 0,
    };

    existing.totalExecutions += 1;
    existing.totalDurationMs += durationMs;
    existing.lastExecutedAt = new Date().toISOString();

    if (outcome?.success) {
      existing.successCount += 1;
    } else {
      existing.failureCount += 1;
    }

    metricsStore.set(actionType, existing);
  }

  static getMetrics(): ActionMetrics[] {
    return Array.from(metricsStore.values());
  }
}
