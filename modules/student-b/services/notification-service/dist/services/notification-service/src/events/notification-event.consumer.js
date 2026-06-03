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
var NotificationEventConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEventConsumer = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = require("amqplib");
const notification_dispatch_service_1 = require("../services/notification-dispatch.service");
const domain_events_1 = require("../../../../shared/events/domain-events");
let NotificationEventConsumer = NotificationEventConsumer_1 = class NotificationEventConsumer {
    constructor(dispatchService, config) {
        this.dispatchService = dispatchService;
        this.config = config;
        this.logger = new common_1.Logger(NotificationEventConsumer_1.name);
        this.connection = null;
        this.channel = null;
        this.rabbitmqUrl = this.config.get('RABBITMQ_URL', 'amqp://localhost:5672');
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
            await this.channel.assertExchange(domain_events_1.EXCHANGES.NOTIFICATIONS, 'topic', { durable: true });
            await this.channel.assertExchange(domain_events_1.EXCHANGES.RESPONSES, 'topic', { durable: true });
            await this.channel.assertQueue(domain_events_1.QUEUES.NOTIFICATION_DISPATCH, {
                durable: true,
                arguments: { 'x-dead-letter-exchange': domain_events_1.EXCHANGES.DEAD_LETTER },
            });
            await this.channel.assertQueue(domain_events_1.QUEUES.RESPONSE_ACTION_EXECUTED, {
                durable: true,
                arguments: { 'x-dead-letter-exchange': domain_events_1.EXCHANGES.DEAD_LETTER },
            });
            await this.channel.bindQueue(domain_events_1.QUEUES.NOTIFICATION_DISPATCH, domain_events_1.EXCHANGES.NOTIFICATIONS, domain_events_1.ROUTING_KEYS.NOTIFICATION_DISPATCH);
            await this.channel.bindQueue(domain_events_1.QUEUES.RESPONSE_ACTION_EXECUTED, domain_events_1.EXCHANGES.RESPONSES, domain_events_1.ROUTING_KEYS.RESPONSE_ACTION_EXECUTED);
            await this.channel.prefetch(5);
            await this.channel.consume(domain_events_1.QUEUES.NOTIFICATION_DISPATCH, async (msg) => {
                if (!msg)
                    return;
                await this.handleNotificationDispatch(msg);
            });
            await this.channel.consume(domain_events_1.QUEUES.RESPONSE_ACTION_EXECUTED, async (msg) => {
                if (!msg)
                    return;
                await this.handleResponseActionExecuted(msg);
            });
            this.connection.on('close', () => {
                this.logger.warn('[Consumer] RabbitMQ connection closed. Reconnecting...');
                setTimeout(() => this.connect(), 5000);
            });
            this.connection.on('error', (err) => {
                this.logger.error(`[Consumer] RabbitMQ connection error: ${err.message}`);
            });
            this.logger.log('[Consumer] Listening on notification queues');
        }
        catch (err) {
            this.logger.error(`[Consumer] Connect failed: ${err.message}`);
            setTimeout(() => this.connect(), 5000);
        }
    }
    async handleNotificationDispatch(msg) {
        try {
            const event = JSON.parse(msg.content.toString());
            this.logger.log(`[Consumer] NotificationDispatch received — ` +
                `triggeredBy=${event.payload.triggeredBy}, ` +
                `notifications=${event.payload.notifications.length}`);
            await this.dispatchService.dispatchMultiple(event.payload.notifications);
            if (this.channel) {
                this.channel.ack(msg);
            }
        }
        catch (err) {
            this.logger.error(`[Consumer] Failed to handle NotificationDispatch: ${err.message}`);
            if (this.channel) {
                this.channel.nack(msg, false, false);
            }
        }
    }
    async handleResponseActionExecuted(msg) {
        try {
            const event = JSON.parse(msg.content.toString());
            const { incidentId, allSuccessful, requiresEscalation, strategyUsed } = event.payload;
            this.logger.log(`[Consumer] ResponseActionExecuted received — incidentId=${incidentId}, ` +
                `allSuccessful=${allSuccessful}, requiresEscalation=${requiresEscalation}`);
            if (requiresEscalation || !allSuccessful) {
                const severity = !allSuccessful ? 'HIGH' : 'MEDIUM';
                const description = !allSuccessful
                    ? `One or more response actions failed for incident ${incidentId}. Manual intervention required.`
                    : `Incident ${incidentId} has been escalated to Tier-3 analysts. Strategy: ${strategyUsed}.`;
                await this.dispatchService.sendIncidentAlert(incidentId, severity, description);
            }
            if (this.channel) {
                this.channel.ack(msg);
            }
        }
        catch (err) {
            this.logger.error(`[Consumer] Failed to handle ResponseActionExecuted: ${err.message}`);
            if (this.channel) {
                this.channel.nack(msg, false, false);
            }
        }
    }
};
exports.NotificationEventConsumer = NotificationEventConsumer;
exports.NotificationEventConsumer = NotificationEventConsumer = NotificationEventConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_dispatch_service_1.NotificationDispatchService,
        config_1.ConfigService])
], NotificationEventConsumer);
//# sourceMappingURL=notification-event.consumer.js.map