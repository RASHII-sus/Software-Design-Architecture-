// middleware/src/handlers/classification.handler.ts
// PATTERN: Chain of Responsibility (Handler 4: Classification)
// Final handler in the pipeline. Uses all previously collected enrichment
// context to classify the alert's final severity and generate a correlation ID.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
import { Severity, Verdict } from '../../../shared/contracts/enums';

interface ClassificationRule {
  name: string;
  condition: (alert: CanonicalAlert) => boolean;
  severity: Severity;
  tags: string[];
}

@Injectable()
export class ClassificationHandler extends EnrichmentHandler {
  private readonly defaultSeverity: Severity;
  private readonly rules: ClassificationRule[];

  constructor(private readonly config: ConfigService) {
    super();
    this.defaultSeverity = (this.config.get<string>(
      'app.classificationDefaultSeverity',
      'MEDIUM',
    ) as Severity);

    // Rule-based classification engine
    // Rules are evaluated in order — first match wins
    this.rules = [
      {
        name: 'CRITICAL: Malicious indicator on critical asset',
        condition: (a) =>
          a.enrichmentContext?.threatIntel?.verdict === Verdict.MALICIOUS &&
          a.enrichmentContext?.assetContext?.criticality === 'CRITICAL',
        severity: Severity.CRITICAL,
        tags: ['malicious-indicator', 'critical-asset'],
      },
      {
        name: 'CRITICAL: Malicious indicator with admin user',
        condition: (a) =>
          a.enrichmentContext?.threatIntel?.verdict === Verdict.MALICIOUS &&
          a.enrichmentContext?.userContext?.privilegeLevel === 'ADMIN',
        severity: Severity.CRITICAL,
        tags: ['malicious-indicator', 'privileged-user'],
      },
      {
        name: 'HIGH: Malicious indicator on any asset',
        condition: (a) =>
          a.enrichmentContext?.threatIntel?.verdict === Verdict.MALICIOUS,
        severity: Severity.HIGH,
        tags: ['malicious-indicator'],
      },
      {
        name: 'HIGH: Known malicious IP range with high reputation score',
        condition: (a) =>
          (a.enrichmentContext?.geoIp?.isKnownMaliciousRange === true) &&
          (a.enrichmentContext?.threatIntel?.reputationScore ?? 0) >= 70,
        severity: Severity.HIGH,
        tags: ['malicious-range', 'high-reputation-score'],
      },
      {
        name: 'MEDIUM: Suspicious indicator',
        condition: (a) =>
          a.enrichmentContext?.threatIntel?.verdict === Verdict.SUSPICIOUS,
        severity: Severity.MEDIUM,
        tags: ['suspicious-indicator'],
      },
      {
        name: 'MEDIUM: Known malicious range (low score)',
        condition: (a) =>
          a.enrichmentContext?.geoIp?.isKnownMaliciousRange === true,
        severity: Severity.MEDIUM,
        tags: ['malicious-range'],
      },
      {
        name: 'LOW: Clean indicator with no risk factors',
        condition: (a) =>
          a.enrichmentContext?.threatIntel?.verdict === Verdict.CLEAN &&
          !a.enrichmentContext?.geoIp?.isKnownMaliciousRange,
        severity: Severity.LOW,
        tags: ['clean-indicator'],
      },
    ];
  }

  getHandlerName(): string {
    return 'ClassificationHandler';
  }

  // PATTERN: Chain of Responsibility — H4 logic (terminal handler)
  protected async doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult> {
    const { matchedRule, classifiedSeverity, tags } = this.classifyAlert(alert);

    this.logger.log(
      `[ClassificationHandler] Alert ${alert.id} classified as ${classifiedSeverity} ` +
        `(rule: "${matchedRule ?? 'DEFAULT'}")`,
    );

    const correlationId = uuidv4();

    const enrichedAlert: CanonicalAlert = {
      ...alert,
      severity: classifiedSeverity,   // Override the ingested severity with classified one
      tags: [...(alert.tags ?? []), ...tags],
      enrichmentContext: {
        ...alert.enrichmentContext,
        classifiedSeverity,
        correlationId,
      },
    };

    return {
      alert: enrichedAlert,
      enriched: true,
      handlerName: this.getHandlerName(),
      skipped: false,
      durationMs: 0,
      metadata: {
        classifiedSeverity,
        originalSeverity: alert.severity,
        matchedRule: matchedRule ?? 'DEFAULT',
        correlationId,
        appliedTags: tags,
      },
    };
  }

  private classifyAlert(alert: CanonicalAlert): {
    matchedRule: string | null;
    classifiedSeverity: Severity;
    tags: string[];
  } {
    for (const rule of this.rules) {
      if (rule.condition(alert)) {
        return {
          matchedRule: rule.name,
          classifiedSeverity: rule.severity,
          tags: rule.tags,
        };
      }
    }

    return {
      matchedRule: null,
      classifiedSeverity: this.defaultSeverity,
      tags: ['unclassified'],
    };
  }
}
