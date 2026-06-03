import {
  Injectable, Logger, OnModuleInit, OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { PipelineAssembler } from '../pipeline/pipeline.assembler';
import { PipelineEventPublisher } from './pipeline-event.publisher';
import {
  EXCHANGES, QUEUES, ROUTING_KEYS, AlertIngestedEvent,
} from '../../../shared/events/domain-events';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';

@Injectable()
export class PipelineEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PipelineEventConsumer.name);
  private connection: amqplib.ChannelModel | null = null;  // FIXED: ChannelModel instead of Connection
  private channel: amqplib.Channel | null = null;
  private readonly rabbitmqUrl: string;

  constructor(
    private readonly assembler: PipelineAssembler,
    private readonly publisher: PipelineEventPublisher,
    private readonly config: ConfigService,
  ) {
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
      await this.channel.assertQueue(QUEUES.ALERT_INGESTED, {
        durable: true,
        arguments: { 'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER },
      });
      await this.channel.bindQueue(
        QUEUES.ALERT_INGESTED,
        EXCHANGES.ALERTS,
        ROUTING_KEYS.ALERT_INGESTED,
      );

      // Prefetch 1 — process one alert at a time for ordered enrichment
      await this.channel.prefetch(1);

      await this.channel.consume(QUEUES.ALERT_INGESTED, async (msg) => {
        if (!msg) return;
        await this.handleMessage(msg);
      });

      this.connection.on('close', () => {
        this.logger.warn('[Consumer] RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err: Error) => {  // ADDED: error handler
        this.logger.error(`[Consumer] RabbitMQ connection error: ${err.message}`);
      });

      this.logger.log(`[Consumer] Listening on queue: ${QUEUES.ALERT_INGESTED}`);
    } catch (err) {
      this.logger.error(`[Consumer] Connect failed: ${(err as Error).message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async handleMessage(msg: amqplib.ConsumeMessage): Promise<void> {
    try {
      const event = JSON.parse(msg.content.toString()) as AlertIngestedEvent;
      this.logger.log(`[Consumer] Received AlertIngested — alertId=${event.payload.alertId}`);

      // We only have the alert summary in the ingested event; a full system
      // would load the full CanonicalAlert from the alert-ingestion-service DB.
      // For now we reconstruct a minimal CanonicalAlert from the event payload
      // to demonstrate the pipeline. In M3, this would be a gRPC fetch.
      const alert: CanonicalAlert = {
        id: event.payload.alertId,
        severity: event.payload.severity,
        timestamp: event.payload.timestamp,
        sourceType: event.payload.sourceType as CanonicalAlert['sourceType'],
        sourceId: event.correlationId ?? event.payload.alertId,
        rawPayload: {},
        normalizedData: {
          title: `Alert from ${event.payload.sourceType}`,
          description: 'Alert received via event bus',
          eventType: event.payload.sourceType,
          sourceIp: undefined,
        },
      };

      const result = await this.assembler.process(alert);

      if (result.completed) {
        await this.publisher.publishAlertEnriched(result);
      } else {
        this.logger.warn(
          `[Consumer] Pipeline stopped at ${result.stoppedAt} — reason: ${result.stopReason}`,
        );
      }

      if (this.channel) {  // ADDED: null check
        this.channel.ack(msg);
      }
    } catch (err) {
      this.logger.error(`[Consumer] Failed to process message: ${(err as Error).message}`);
      // Nack without requeue — send to dead letter queue
      if (this.channel) {  // ADDED: null check
        this.channel.nack(msg, false, false);
      }
    }
  }
}