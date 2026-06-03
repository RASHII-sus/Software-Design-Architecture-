// services/response-orchestration-service/src/events/response-orchestration-event.publisher.ts

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { ActionOutcome } from '../../../../shared/contracts/interfaces';
import {
  EXCHANGES,
  ROUTING_KEYS,
  ResponseActionExecutedEvent,
} from '../../../../shared/events/domain-events';

@Injectable()
export class ResponseOrchestrationEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ResponseOrchestrationEventPublisher.name);
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

  async publishResponseActionExecuted(
    incidentId: string,
    responsePlanId: string,
    actions: ActionOutcome[],
    strategyUsed: string,
  ): Promise<void> {
    const allSuccessful = actions.every((a) => a.success);
    const requiresEscalation = actions.some((a) => !a.success);

    const event: ResponseActionExecutedEvent = {
      eventId: uuidv4(),
      eventType: 'ResponseActionExecuted',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      source: 'response-orchestration-service',
      payload: {
        responsePlanId,
        incidentId,
        actions,
        strategyUsed,
        allSuccessful,
        requiresEscalation,
      },
    };

    await this.publish(EXCHANGES.RESPONSES, ROUTING_KEYS.RESPONSE_ACTION_EXECUTED, event);
    this.logger.log(
      `[EventPublisher] Published ResponseActionExecuted for incident ${incidentId} — ` +
        `${actions.length} actions, allSuccessful=${allSuccessful}`,
    );
  }

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

      await this.channel.assertExchange(EXCHANGES.RESPONSES, 'topic', { durable: true });

      this.connection.on('close', () => {
        this.logger.warn('[EventPublisher] RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });

      this.logger.log('[EventPublisher] Connected to RabbitMQ');
    } catch (err) {
      this.logger.error(`[EventPublisher] RabbitMQ connect failed: ${(err as Error).message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async publish(exchange: string, routingKey: string, event: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.warn('[EventPublisher] Channel not ready — skipping publish');
      return;
    }
    const buffer = Buffer.from(JSON.stringify(event));
    this.channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      contentType: 'application/json',
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