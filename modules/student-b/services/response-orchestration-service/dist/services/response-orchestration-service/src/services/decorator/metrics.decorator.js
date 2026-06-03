"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsDecorator = void 0;
const response_action_decorator_1 = require("./response-action.decorator");
const metricsStore = new Map();
class MetricsDecorator extends response_action_decorator_1.ResponseActionDecorator {
    constructor(wrappedAction) {
        super(wrappedAction);
    }
    async execute(target) {
        const startMs = Date.now();
        const actionType = this.getType();
        let outcome;
        try {
            outcome = await this.wrappedAction.execute(target);
        }
        finally {
            const durationMs = Date.now() - startMs;
            this.recordMetric(actionType, outcome ?? null, durationMs);
            this.logger.debug(`[MetricsDecorator] ${actionType} completed in ${durationMs}ms` +
                (outcome ? ` — success=${outcome.success}` : ''));
        }
        return outcome;
    }
    async rollback(context) {
        const startMs = Date.now();
        const outcome = await this.wrappedAction.rollback(context);
        const durationMs = Date.now() - startMs;
        this.logger.debug(`[MetricsDecorator] Rollback ${this.getType()} completed in ${durationMs}ms`);
        return outcome;
    }
    recordMetric(actionType, outcome, durationMs) {
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
        }
        else {
            existing.failureCount += 1;
        }
        metricsStore.set(actionType, existing);
    }
    static getMetrics() {
        return Array.from(metricsStore.values());
    }
}
exports.MetricsDecorator = MetricsDecorator;
//# sourceMappingURL=metrics.decorator.js.map