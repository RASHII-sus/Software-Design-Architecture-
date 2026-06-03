// services/threat-intel-service/src/services/proxy/access-control.proxy.ts
// PATTERN: Proxy (Access Control / Protection Proxy)
// Validates that the caller has a valid API key before delegating to the
// real ThreatIntelProvider. Prevents unauthorized access to external APIs
// which have cost implications.

import { Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThreatIntelProvider } from '../adapter/threat-intel-provider.interface';
import { IndicatorType } from '../../../../../shared/contracts/enums';
import { ReputationResult } from '../../../../../shared/contracts/interfaces';

export interface AccessControlContext {
  apiKey: string;
  requesterId?: string;
  roles?: string[];
}

// PATTERN: Proxy — implements same interface, intercepts for authorization check
export class AccessControlProxy implements ThreatIntelProvider {
  private readonly logger = new Logger(AccessControlProxy.name);
  private readonly internalApiKey: string;

  constructor(
    private readonly realProvider: ThreatIntelProvider,
    private readonly config: ConfigService,
  ) {
    this.internalApiKey = this.config.get<string>('app.apiKeySecret', 'dev-secret');
  }

  getProviderName(): string {
    return `AccessControlProxy(${this.realProvider.getProviderName()})`;
  }

  supports(type: IndicatorType): boolean {
    return this.realProvider.supports(type);
  }

  // PATTERN: Proxy — validates authorization before delegating to real provider
  async checkReputation(
    indicator: string,
    type: IndicatorType,
    context?: AccessControlContext,
  ): Promise<ReputationResult> {
    this.validateAccess(context);

    this.logger.debug(
      `[AccessControlProxy] Access granted for requester=${context?.requesterId ?? 'internal'}` +
        ` → delegating to ${this.realProvider.getProviderName()}`,
    );

    return this.realProvider.checkReputation(indicator, type);
  }

  // ─── Authorization logic ─────────────────────────────────────────────────────
  private validateAccess(context?: AccessControlContext): void {
    // When called internally (no context), trust the call
    if (!context) return;

    if (!context.apiKey) {
      throw new UnauthorizedException(
        'Access denied: API key is required to use threat intelligence services.',
      );
    }

    if (context.apiKey !== this.internalApiKey) {
      this.logger.warn(
        `[AccessControlProxy] Invalid API key attempt from requester=${context.requesterId ?? 'unknown'}`,
      );
      throw new ForbiddenException(
        'Access denied: Invalid API key for threat intelligence service.',
      );
    }
  }
}
