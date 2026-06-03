import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { PipelineResult } from '../handlers/enrichment-handler.abstract';
import {
  EXCHANGES, ROUTING_KEYS, AlertEnrichedEvent,
} from '../../../shared/events/domain-events';

@Injectable()
export class PipelineEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PipelineEventPublisher.name);
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
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch {}
  }

  async publishAlertEnriched(result: PipelineResult): Promise<void> {
    const event: AlertEnrichedEvent = {
      eventId: uuidv4(),
      eventType: 'AlertEnriched',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      source: 'middleware',
      payload: {
        alertId: result.originalAlertId,
        enrichedAlert: result.processedAlert,
        pipelineStages: result.stageResults.map((s) => s.handlerName),
        processingTimeMs: result.totalDurationMs,
      },
    };

    await this.publish(EXCHANGES.ALERTS, ROUTING_KEYS.ALERT_ENRICHED, event);
    this.logger.log(
      `[Publisher] AlertEnriched published for ${result.originalAlertId} ` +
        `(${result.totalDurationMs}ms, ${result.stageResults.length} stages)`,
    );
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.rabbitmqUrl);
      if (!this.connection) {  // ADDED: null check
        throw new Error('Failed to create connection');
      }

      this.channel = await this.connection.createChannel();
      if (!this.channel) {  // ADDED: null check
        throw new Error('Failed to create channel');
      }

      await this.channel.assertExchange(EXCHANGES.ALERTS, 'topic', { durable: true });

      this.connection.on('close', () => {
        this.logger.warn('[Publisher] RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err: Error) => {  // ADDED: error handler
        this.logger.error(`[Publisher] RabbitMQ connection error: ${err.message}`);
      });

      this.logger.log('[Publisher] Connected to RabbitMQ');
    } catch (err) {
      this.logger.error(`[Publisher] Connect failed: ${(err as Error).message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async publish(exchange: string, routingKey: string, event: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.warn('[Publisher] Channel not ready — skipping publish');
      return;
    }
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)), {
      persistent: true, contentType: 'application/json', messageId: uuidv4(),
    });
  }
}