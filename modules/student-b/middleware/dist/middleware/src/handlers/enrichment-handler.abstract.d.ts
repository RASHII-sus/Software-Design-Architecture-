import { Logger } from '@nestjs/common';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
export interface EnrichmentResult {
    alert: CanonicalAlert;
    enriched: boolean;
    handlerName: string;
    skipped: boolean;
    skipReason?: string;
    durationMs: number;
    metadata?: Record<string, unknown>;
}
export interface PipelineResult {
    originalAlertId: string;
    processedAlert: CanonicalAlert;
    stageResults: EnrichmentResult[];
    totalDurationMs: number;
    completed: boolean;
    stoppedAt?: string;
    stopReason?: string;
}
export declare abstract class EnrichmentHandler {
    protected readonly logger: Logger;
    private nextHandler;
    constructor();
    setNext(handler: EnrichmentHandler): EnrichmentHandler;
    handle(alert: CanonicalAlert, results: EnrichmentResult[]): Promise<CanonicalAlert>;
    protected abstract doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult>;
    abstract getHandlerName(): string;
}
