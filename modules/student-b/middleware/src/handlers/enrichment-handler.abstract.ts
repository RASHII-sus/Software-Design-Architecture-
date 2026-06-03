// middleware/src/handlers/enrichment-handler.abstract.ts
// PATTERN: Chain of Responsibility
// Defines the abstract handler. Each concrete handler either:
//   (a) processes the alert and passes to next handler, or
//   (b) stops the chain (e.g. on deduplication hit).
// Handlers are linked at runtime by the PipelineAssembler.

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

// PATTERN: Chain of Responsibility — abstract handler with next-handler link
export abstract class EnrichmentHandler {
  protected readonly logger: Logger;
  private nextHandler: EnrichmentHandler | null = null;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Link this handler to the next in the chain.
   * Returns the next handler for fluent chaining:
   *   h1.setNext(h2).setNext(h3)
   */
  setNext(handler: EnrichmentHandler): EnrichmentHandler {
    this.nextHandler = handler;
    return handler;
  }

  /**
   * Entry point. Calls doEnrich(), then passes to next if chain should continue.
   */
  async handle(alert: CanonicalAlert, results: EnrichmentResult[]): Promise<CanonicalAlert> {
    const start = Date.now();

    const result = await this.doEnrich(alert);
    results.push({ ...result, durationMs: Date.now() - start });

    if (result.skipped && result.skipReason === 'DUPLICATE') {
      // Hard stop — duplicate alerts are discarded entirely
      this.logger.warn(
        `[Pipeline] Chain STOPPED at ${this.getHandlerName()} — reason: ${result.skipReason}`,
      );
      return result.alert;
    }

    // Pass enriched alert to next handler in chain
    if (this.nextHandler) {
      return this.nextHandler.handle(result.alert, results);
    }

    return result.alert;
  }

  /**
   * Implemented by each concrete handler. Contains enrichment logic.
   */
  protected abstract doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult>;

  /**
   * Returns the handler name for logging and pipeline result reporting.
   */
  abstract getHandlerName(): string;
}
