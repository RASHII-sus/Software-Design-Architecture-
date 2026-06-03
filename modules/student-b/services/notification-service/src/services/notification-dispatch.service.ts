// services/notification-service/src/services/notification-dispatch.service.ts
// PATTERN: Abstract Factory
// Uses the injected NotificationFactory to create the correct channel
// notifiers at runtime. Calling code never references concrete notifiers —
// only the factory and the Notifier interface.

import { Injectable, Logger, Inject } from '@nestjs/common';
import { NotificationFactory } from './factory/notification.factory.interface';
import { NotificationRecordRepository } from '../domain/repositories/notification-record.repository';
import {
  NotificationChannel,
  NotificationStatus,
} from '../../../../shared/contracts/enums';
import {
  NotificationPayload,
  DeliveryResult,
} from '../../../../shared/contracts/interfaces';

export const NOTIFICATION_FACTORY = 'NOTIFICATION_FACTORY';

export interface DispatchResult {
  results: DeliveryResult[];
  allSuccessful: boolean;
  failedChannels: NotificationChannel[];
}

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    // PATTERN: Abstract Factory — injected factory determines which notifiers are created
    @Inject(NOTIFICATION_FACTORY)
    private readonly factory: NotificationFactory,
    private readonly recordRepository: NotificationRecordRepository,
  ) {
    this.logger.log(
      `[NotificationDispatchService] Using factory tier: ${this.factory.getTierName()}`,
    );
  }

  async dispatch(payload: NotificationPayload): Promise<DeliveryResult> {
    this.logger.log(
      `[NotificationDispatchService] Dispatching ${payload.channel} notification ` +
        `to ${payload.recipient}`,
    );

    // PATTERN: Abstract Factory — create the channel-specific notifier via factory
    const notifier = this.resolveNotifier(payload.channel);

    // Persist record before sending
    const record = await this.recordRepository.create({
      channel: payload.channel,
      recipient: payload.recipient,
      subject: payload.subject ?? null,
      body: payload.body,
      metadata: payload.metadata ?? {},
      status: NotificationStatus.PENDING,
      attempts: 0,
    });

    const result = await notifier.send(payload);

    // Update persistence record
    if (result.success) {
      await this.recordRepository.markSent(record.id, result.messageId);
    } else {
      await this.recordRepository.markFailed(record.id, result.error ?? 'Unknown error', 1);
    }

    return result;
  }

  async dispatchMultiple(payloads: NotificationPayload[]): Promise<DispatchResult> {
    this.logger.log(
      `[NotificationDispatchService] Dispatching ${payloads.length} notifications`,
    );

    const results = await Promise.allSettled(
      payloads.map((payload) => this.dispatch(payload)),
    );

    const deliveryResults: DeliveryResult[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      const errorResult: DeliveryResult = {
        notificationId: `error-${i}`,
        channel: payloads[i].channel,
        success: false,
        error: (r.reason as Error).message,
      };
      return errorResult;
    });

    const failedChannels = deliveryResults
      .filter((r) => !r.success)
      .map((r) => r.channel);

    return {
      results: deliveryResults,
      allSuccessful: failedChannels.length === 0,
      failedChannels,
    };
  }

  async sendIncidentAlert(
    incidentId: string,
    severity: string,
    description: string,
  ): Promise<DispatchResult> {
    // PATTERN: Abstract Factory — factory determines which notifiers are available
    const availableNotifiers = this.factory.getAvailableNotifiers();

    const payloads: NotificationPayload[] = availableNotifiers.map((notifier) => ({
      channel: notifier.getChannel(),
      recipient: this.getDefaultRecipient(notifier.getChannel()),
      subject: `[${severity}] Security Incident ${incidentId}`,
      body: `A ${severity} severity incident has been created.\n\nIncident ID: ${incidentId}\n\nDescription: ${description}`,
      metadata: { incidentId, severity },
      priority: severity === 'CRITICAL' ? 'HIGH' as const : 'MEDIUM' as const,
    }));

    return this.dispatchMultiple(payloads);
  }

  getFactoryTier(): string {
    return this.factory.getTierName();
  }

  async getStats() {
    return this.recordRepository.countByStatus();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────
  private resolveNotifier(channel: NotificationChannel) {
    // PATTERN: Abstract Factory — delegate creation to the factory
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.factory.createEmailNotifier();
      case NotificationChannel.SLACK:
        return this.factory.createSlackNotifier();
      case NotificationChannel.PAGERDUTY:
        return this.factory.createPagerDutyNotifier();
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private getDefaultRecipient(channel: NotificationChannel): string {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return process.env.SOC_EMAIL_RECIPIENT ?? 'soc@example.com';
      case NotificationChannel.SLACK:
        return process.env.SLACK_DEFAULT_CHANNEL ?? '#soc-alerts';
      case NotificationChannel.PAGERDUTY:
        return process.env.PAGERDUTY_SERVICE_KEY ?? '';
      default:
        return '';
    }
  }
}
