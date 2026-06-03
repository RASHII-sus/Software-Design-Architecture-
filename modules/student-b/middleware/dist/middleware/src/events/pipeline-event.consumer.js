"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PipelineEventConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineEventConsumer = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = require("amqplib");
const pipeline_assembler_1 = require("../pipeline/pipeline.assembler");
const pipeline_event_publisher_1 = require("./pipeline-event.publisher");
const domain_events_1 = require("../../../shared/events/domain-events");
let PipelineEventConsumer = PipelineEventConsumer_1 = class PipelineEventConsumer {
    constructor(assembler, publisher, config) {
        this.assembler = assembler;
        this.publisher = publisher;
        this.config = config;
        this.logger = new common_1.Logger(PipelineEventConsumer_1.name);
        this.connection = null;
        this.channel = null;
        this.rabbitmqUrl = this.config.get('rabbitmq.url');
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
        }
        catch { }
    }
    async connect() {
        try {
            this.connection = await amqplib.connect(this.rabbitmqUrl);
            if (!this.connection) {
                throw new Error('Failed to create connection');
            }
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error('Failed to create channel');
            }
            await this.channel.assertExchange(domain_events_1.EXCHANGES.ALERTS, 'topic', { durable: true });
            await this.channel.assertQueue(domain_events_1.QUEUES.ALERT_INGESTED, {
                durable: true,
                arguments: { 'x-dead-letter-exchange': domain_events_1.EXCHANGES.DEAD_LETTER },
            });
            await this.channel.bindQueue(domain_events_1.QUEUES.ALERT_INGESTED, domain_events_1.EXCHANGES.ALERTS, domain_events_1.ROUTING_KEYS.ALERT_INGESTED);
            await this.channel.prefetch(1);
            await this.channel.consume(domain_events_1.QUEUES.ALERT_INGESTED, async (msg) => {
                if (!msg)
                    return;
                await this.handleMessage(msg);
            });
            this.connection.on('close', () => {
                this.logger.warn('[Consumer] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });
            this.connection.on('error', (err) => {
                this.logger.error(`[Consumer] RabbitMQ connection error: ${err.message}`);
            });
            this.logger.log(`[Consumer] Listening on queue: ${domain_events_1.QUEUES.ALERT_INGESTED}`);
        }
        catch (err) {
            this.logger.error(`[Consumer] Connect failed: ${err.message}`);
            setTimeout(() => this.connect(), 5000);
        }
    }
    async handleMessage(msg) {
        try {
            const event = JSON.parse(msg.content.toString());
            this.logger.log(`[Consumer] Received AlertIngested — alertId=${event.payload.alertId}`);
            const alert = {
                id: event.payload.alertId,
                severity: event.payload.severity,
                timestamp: event.payload.timestamp,
                sourceType: event.payload.sourceType,
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
            }
            else {
                this.logger.warn(`[Consumer] Pipeline stopped at ${result.stoppedAt} — reason: ${result.stopReason}`);
            }
            if (this.channel) {
                this.channel.ack(msg);
            }
        }
        catch (err) {
            this.logger.error(`[Consumer] Failed to process message: ${err.message}`);
            if (this.channel) {
                this.channel.nack(msg, false, false);
            }
        }
    }
};
exports.PipelineEventConsumer = PipelineEventConsumer;
exports.PipelineEventConsumer = PipelineEventConsumer = PipelineEventConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pipeline_assembler_1.PipelineAssembler,
        pipeline_event_publisher_1.PipelineEventPublisher,
        config_1.ConfigService])
], PipelineEventConsumer);
//# sourceMappingURL=pipeline-event.consumer.js.map