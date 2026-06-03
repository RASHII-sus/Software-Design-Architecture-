// services/threat-intel-service/src/events/threat-intel-event.publisher.ts
// Publishes domain events to RabbitMQ when threat intel data changes.

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { ReputationResult } from '../../../../shared/contracts/interfaces';
import {
  EXCHANGES,
  ROUTING_KEYS,
  ThreatIntelUpdatedEvent,
} from '../../../../shared/events/domain-events';

@Injectable()
export class ThreatIntelEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ThreatIntelEventPublisher.name);
  private connection: amqplib.ChannelModel | null = null;  // FIXED: ChannelModel instead of Connection
  private channel: amqplib.Channel | null = null;
  private readonly rabbitmqUrl: string;

  constructor(private readonly config: ConfigService) {
    this.rabbitmqUrl = this.config.get<string>('rabbitmq.url')!;
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async publishThreatIntelUpdated(result: ReputationResult): Promise<void> {
    const event: ThreatIntelUpdatedEvent = {
      eventId: uuidv4(),
      eventType: 'ThreatIntelUpdated',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      source: 'threat-intel-service',
      payload: {
        indicator: result.indicator,
        indicatorType: result.indicatorType,
        newVerdict: result.verdict,
        source: result.source,
        reputationResult: result,
      },
    };

    await this.publish(EXCHANGES.THREAT_INTEL, ROUTING_KEYS.THREAT_INTEL_UPDATED, event);
    this.logger.log(
      `[EventPublisher] Published ThreatIntelUpdated for ${result.indicator} (${result.verdict})`,
    );
  }

  // ─── Private RabbitMQ helpers ─────────────────────────────────────────────────
  private async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.rabbitmqUrl);
      if (!this.connection) {
        throw new Error('Failed to create connection');
      }
      
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      // Assert the exchange exists (idempotent)
      await this.channel.assertExchange(EXCHANGES.THREAT_INTEL, 'topic', { durable: true });

      this.connection.on('error', (err: Error) => {
        this.logger.error(`[EventPublisher] RabbitMQ connection error: ${err.message}`);
      });
      this.connection.on('close', () => {
        this.logger.warn('[EventPublisher] RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });

      this.logger.log('[EventPublisher] Connected to RabbitMQ');
    } catch (err) {
      this.logger.error(`[EventPublisher] Failed to connect to RabbitMQ: ${(err as Error).message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async publish(
    exchange: string,
    routingKey: string,
    event: unknown,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn('[EventPublisher] Channel not ready — skipping publish');
      return;
    }
    const buffer = Buffer.from(JSON.stringify(event));
    this.channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      messageId: uuidv4(),
    });
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch {
      // Ignore errors on shutdown
    }
  }
}