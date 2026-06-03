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
var ResponseOrchestrationEventPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseOrchestrationEventPublisher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = require("amqplib");
const uuid_1 = require("uuid");
const domain_events_1 = require("../../../../shared/events/domain-events");
let ResponseOrchestrationEventPublisher = ResponseOrchestrationEventPublisher_1 = class ResponseOrchestrationEventPublisher {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(ResponseOrchestrationEventPublisher_1.name);
        this.connection = null;
        this.channel = null;
        this.rabbitmqUrl = this.config.get('rabbitmq.url');
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async publishResponseActionExecuted(incidentId, responsePlanId, actions, strategyUsed) {
        const allSuccessful = actions.every((a) => a.success);
        const requiresEscalation = actions.some((a) => !a.success);
        const event = {
            eventId: (0, uuid_1.v4)(),
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
        await this.publish(domain_events_1.EXCHANGES.RESPONSES, domain_events_1.ROUTING_KEYS.RESPONSE_ACTION_EXECUTED, event);
        this.logger.log(`[EventPublisher] Published ResponseActionExecuted for incident ${incidentId} — ` +
            `${actions.length} actions, allSuccessful=${allSuccessful}`);
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
            await this.channel.assertExchange(domain_events_1.EXCHANGES.RESPONSES, 'topic', { durable: true });
            this.connection.on('close', () => {
                this.logger.warn('[EventPublisher] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });
            this.logger.log('[EventPublisher] Connected to RabbitMQ');
        }
        catch (err) {
            this.logger.error(`[EventPublisher] RabbitMQ connect failed: ${err.message}`);
            setTimeout(() => this.connect(), 5000);
        }
    }
    async publish(exchange, routingKey, event) {
        if (!this.channel) {
            this.logger.warn('[EventPublisher] Channel not ready — skipping publish');
            return;
        }
        const buffer = Buffer.from(JSON.stringify(event));
        this.channel.publish(exchange, routingKey, buffer, {
            persistent: true,
            contentType: 'application/json',
            messageId: (0, uuid_1.v4)(),
        });
    }
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
        }
        catch {
        }
    }
};
exports.ResponseOrchestrationEventPublisher = ResponseOrchestrationEventPublisher;
exports.ResponseOrchestrationEventPublisher = ResponseOrchestrationEventPublisher = ResponseOrchestrationEventPublisher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ResponseOrchestrationEventPublisher);
//# sourceMappingURL=response-orchestration-event.publisher.js.map