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
var ThreatIntelEventPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelEventPublisher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = require("amqplib");
const uuid_1 = require("uuid");
const domain_events_1 = require("../../../../shared/events/domain-events");
let ThreatIntelEventPublisher = ThreatIntelEventPublisher_1 = class ThreatIntelEventPublisher {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(ThreatIntelEventPublisher_1.name);
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
    async publishThreatIntelUpdated(result) {
        const event = {
            eventId: (0, uuid_1.v4)(),
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
        await this.publish(domain_events_1.EXCHANGES.THREAT_INTEL, domain_events_1.ROUTING_KEYS.THREAT_INTEL_UPDATED, event);
        this.logger.log(`[EventPublisher] Published ThreatIntelUpdated for ${result.indicator} (${result.verdict})`);
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
            await this.channel.assertExchange(domain_events_1.EXCHANGES.THREAT_INTEL, 'topic', { durable: true });
            this.connection.on('error', (err) => {
                this.logger.error(`[EventPublisher] RabbitMQ connection error: ${err.message}`);
            });
            this.connection.on('close', () => {
                this.logger.warn('[EventPublisher] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });
            this.logger.log('[EventPublisher] Connected to RabbitMQ');
        }
        catch (err) {
            this.logger.error(`[EventPublisher] Failed to connect to RabbitMQ: ${err.message}`);
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
            timestamp: Date.now(),
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
exports.ThreatIntelEventPublisher = ThreatIntelEventPublisher;
exports.ThreatIntelEventPublisher = ThreatIntelEventPublisher = ThreatIntelEventPublisher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ThreatIntelEventPublisher);
//# sourceMappingURL=threat-intel-event.publisher.js.map