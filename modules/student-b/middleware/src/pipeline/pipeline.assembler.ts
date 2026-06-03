// middleware/src/pipeline/pipeline.assembler.ts
// PATTERN: Chain of Responsibility
// Assembles the handler chain in the correct order at runtime.
// The assembly is separate from the handlers themselves — chain order
// can be reconfigured here without touching individual handler logic.

import { Injectable, Logger } from '@nestjs/common';
import { EnrichmentHandler, PipelineResult } from '../handlers/enrichment-handler.abstract';
import { DeduplicationHandler } from '../handlers/deduplication.handler';
import { GeoIPHandler } from '../handlers/geo-ip.handler';
import { ThreatIntelHandler } from '../handlers/threat-intel.handler';
import { ClassificationHandler } from '../handlers/classification.handler';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';

@Injectable()
export class PipelineAssembler {
  private readonly logger = new Logger(PipelineAssembler.name);
  private readonly head: EnrichmentHandler;

  constructor(
    // PATTERN: Chain of Responsibility — handlers injected in order
    private readonly deduplicationHandler: DeduplicationHandler,
    private readonly geoIPHandler: GeoIPHandler,
    private readonly threatIntelHandler: ThreatIntelHandler,
    private readonly classificationHandler: ClassificationHandler,
  ) {
    // PATTERN: Chain of Responsibility — assemble the chain once at startup
    // H1 → H2 → H3 → H4
    this.deduplicationHandler
      .setNext(this.geoIPHandler)
      .setNext(this.threatIntelHandler)
      .setNext(this.classificationHandler);

    this.head = this.deduplicationHandler;

    this.logger.log(
      '[PipelineAssembler] Chain assembled: ' +
        'DeduplicationHandler → GeoIPHandler → ThreatIntelHandler → ClassificationHandler',
    );
  }

  async process(alert: CanonicalAlert): Promise<PipelineResult> {
    const start = Date.now();
    this.logger.log(
      `[PipelineAssembler] Processing alert ${alert.id} (${alert.sourceType}:${alert.normalizedData.eventType})`,
    );

    const stageResults: Parameters<typeof this.head.handle>[1] = [];

    let processedAlert: CanonicalAlert;
    let stoppedAt: string | undefined;
    let stopReason: string | undefined;

    try {
      processedAlert = await this.head.handle(alert, stageResults);
    } catch (err) {
      this.logger.error(
        `[PipelineAssembler] Unhandled error in pipeline for alert ${alert.id}: ` +
          (err as Error).message,
        (err as Error).stack,
      );
      throw err;
    }

    // Determine if the chain was stopped early
    const stoppedStage = stageResults.find((r) => r.skipped && r.skipReason === 'DUPLICATE');
    if (stoppedStage) {
      stoppedAt = stoppedStage.handlerName;
      stopReason = stoppedStage.skipReason;
    }

    const totalDurationMs = Date.now() - start;
    this.logger.log(
      `[PipelineAssembler] Alert ${alert.id} processed in ${totalDurationMs}ms — ` +
        `stages completed: ${stageResults.filter((r) => r.enriched).length}/${stageResults.length}`,
    );

    return {
      originalAlertId: alert.id,
      processedAlert,
      stageResults,
      totalDurationMs,
      completed: !stoppedAt,
      stoppedAt,
      stopReason,
    };
  }

  getChainDescription(): string[] {
    return [
      'DeduplicationHandler (H1)',
      'GeoIPHandler (H2)',
      'ThreatIntelHandler (H3)',
      'ClassificationHandler (H4)',
    ];
  }
}
