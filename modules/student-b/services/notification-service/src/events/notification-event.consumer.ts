// services/notification-service/src/events/notification-event.consumer.ts
// Consumes NotificationDispatch and ResponseActionExecuted events from
// RabbitMQ and dispatches notifications through the Abstract Factory.

import {
  Injectable, Logger, OnModuleInit, OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { NotificationDispatchService } from '../services/notification-dispatch.service';
import {
  EXCHANGES, QUEUES, ROUTING_KEYS,
  NotificationDispatchEvent, ResponseActionExecutedEvent,
} from '../../../../shared/events/domain-events';

@Injectable()
export class NotificationEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationEventConsumer.name);
  private connection: amqplib.ChannelModel | null = null;  // FIXED: ChannelModel instead of Connection
  private channel: amqplib.Channel | null = null;
  private readonly rabbitmqUrl: string;

  constructor(
    private readonly dispatchService: NotificationDispatchService,
    private readonly config: ConfigService,
  ) {
    this.rabbitmqUrl = this.config.get('RABBITMQ_URL', 'amqp://localhost:5672');
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

      // Assert exchanges and queues
      await this.channel.assertExchange(EXCHANGES.NOTIFICATIONS, 'topic', { durable: true });
      await this.channel.assertExchange(EXCHANGES.RESPONSES, 'topic', { durable: true });

      await this.channel.assertQueue(QUEUES.NOTIFICATION_DISPATCH, {
        durable: true,
        arguments: { 'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER },
      });
      await this.channel.assertQueue(QUEUES.RESPONSE_ACTION_EXECUTED, {
        durable: true,
        arguments: { 'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER },
      });

      // Bind queues
      await this.channel.bindQueue(
        QUEUES.NOTIFICATION_DISPATCH,
        EXCHANGES.NOTIFICATIONS,
        ROUTING_KEYS.NOTIFICATION_DISPATCH,
      );
      await this.channel.bindQueue(
        QUEUES.RESPONSE_ACTION_EXECUTED,
        EXCHANGES.RESPONSES,
        ROUTING_KEYS.RESPONSE_ACTION_EXECUTED,
      );

      await this.channel.prefetch(5);

      // Consume notification dispatch events
      await this.channel.consume(QUEUES.NOTIFICATION_DISPATCH, async (msg) => {
        if (!msg) return;
        await this.handleNotificationDispatch(msg);
      });

      // Consume response action executed events for automatic escalation notifications
      await this.channel.consume(QUEUES.RESPONSE_ACTION_EXECUTED, async (msg) => {
        if (!msg) return;
        await this.handleResponseActionExecuted(msg);
      });

      this.connection.on('close', () => {
        this.logger.warn('[Consumer] RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err: Error) => {
        this.logger.error(`[Consumer] RabbitMQ connection error: ${err.message}`);
      });

      this.logger.log('[Consumer] Listening on notification queues');
    } catch (err) {
      this.logger.error(`[Consumer] Connect failed: ${(err as Error).message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async handleNotificationDispatch(msg: amqplib.ConsumeMessage): Promise<void> {
    try {
      const event = JSON.parse(msg.content.toString()) as NotificationDispatchEvent;
      this.logger.log(
        `[Consumer] NotificationDispatch received — ` +
          `triggeredBy=${event.payload.triggeredBy}, ` +
          `notifications=${event.payload.notifications.length}`,
      );

      await this.dispatchService.dispatchMultiple(event.payload.notifications);
      if (this.channel) {
        this.channel.ack(msg);
      }
    } catch (err) {
      this.logger.error(
        `[Consumer] Failed to handle NotificationDispatch: ${(err as Error).message}`,
      );
      if (this.channel) {
        this.channel.nack(msg, false, false);
      }
    }
  }

  private async handleResponseActionExecuted(msg: amqplib.ConsumeMessage): Promise<void> {
    try {
      const event = JSON.parse(msg.content.toString()) as ResponseActionExecutedEvent;
      const { incidentId, allSuccessful, requiresEscalation, strategyUsed } = event.payload;

      this.logger.log(
        `[Consumer] ResponseActionExecuted received — incidentId=${incidentId}, ` +
          `allSuccessful=${allSuccessful}, requiresEscalation=${requiresEscalation}`,
      );

      // Only send notification if escalation is required or actions failed
      if (requiresEscalation || !allSuccessful) {
        const severity = !allSuccessful ? 'HIGH' : 'MEDIUM';
        const description =
          !allSuccessful
            ? `One or more response actions failed for incident ${incidentId}. Manual intervention required.`
            : `Incident ${incidentId} has been escalated to Tier-3 analysts. Strategy: ${strategyUsed}.`;

        await this.dispatchService.sendIncidentAlert(incidentId, severity, description);
      }

      if (this.channel) {
        this.channel.ack(msg);
      }
    } catch (err) {
      this.logger.error(
        `[Consumer] Failed to handle ResponseActionExecuted: ${(err as Error).message}`,
      );
      if (this.channel) {
        this.channel.nack(msg, false, false);
      }
    }
  }
}