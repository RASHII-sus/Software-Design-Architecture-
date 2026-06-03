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
var PipelineEventPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineEventPublisher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = require("amqplib");
const uuid_1 = require("uuid");
const domain_events_1 = require("../../../shared/events/domain-events");
let PipelineEventPublisher = PipelineEventPublisher_1 = class PipelineEventPublisher {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(PipelineEventPublisher_1.name);
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
    async publishAlertEnriched(result) {
        const event = {
            eventId: (0, uuid_1.v4)(),
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
        await this.publish(domain_events_1.EXCHANGES.ALERTS, domain_events_1.ROUTING_KEYS.ALERT_ENRICHED, event);
        this.logger.log(`[Publisher] AlertEnriched published for ${result.originalAlertId} ` +
            `(${result.totalDurationMs}ms, ${result.stageResults.length} stages)`);
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
            this.connection.on('close', () => {
                this.logger.warn('[Publisher] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });
            this.connection.on('error', (err) => {
                this.logger.error(`[Publisher] RabbitMQ connection error: ${err.message}`);
            });
            this.logger.log('[Publisher] Connected to RabbitMQ');
        }
        catch (err) {
            this.logger.error(`[Publisher] Connect failed: ${err.message}`);
            setTimeout(() => this.connect(), 5000);
        }
    }
    async publish(exchange, routingKey, event) {
        if (!this.channel) {
            this.logger.warn('[Publisher] Channel not ready — skipping publish');
            return;
        }
        this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)), {
            persistent: true, contentType: 'application/json', messageId: (0, uuid_1.v4)(),
        });
    }
};
exports.PipelineEventPublisher = PipelineEventPublisher;
exports.PipelineEventPublisher = PipelineEventPublisher = PipelineEventPublisher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PipelineEventPublisher);
//# sourceMappingURL=pipeline-event.publisher.js.map