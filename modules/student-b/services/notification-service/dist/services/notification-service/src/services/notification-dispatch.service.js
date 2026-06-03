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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationDispatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatchService = exports.NOTIFICATION_FACTORY = void 0;
const common_1 = require("@nestjs/common");
const notification_record_repository_1 = require("../domain/repositories/notification-record.repository");
const enums_1 = require("../../../../shared/contracts/enums");
exports.NOTIFICATION_FACTORY = 'NOTIFICATION_FACTORY';
let NotificationDispatchService = NotificationDispatchService_1 = class NotificationDispatchService {
    constructor(factory, recordRepository) {
        this.factory = factory;
        this.recordRepository = recordRepository;
        this.logger = new common_1.Logger(NotificationDispatchService_1.name);
        this.logger.log(`[NotificationDispatchService] Using factory tier: ${this.factory.getTierName()}`);
    }
    async dispatch(payload) {
        this.logger.log(`[NotificationDispatchService] Dispatching ${payload.channel} notification ` +
            `to ${payload.recipient}`);
        const notifier = this.resolveNotifier(payload.channel);
        const record = await this.recordRepository.create({
            channel: payload.channel,
            recipient: payload.recipient,
            subject: payload.subject ?? null,
            body: payload.body,
            metadata: payload.metadata ?? {},
            status: enums_1.NotificationStatus.PENDING,
            attempts: 0,
        });
        const result = await notifier.send(payload);
        if (result.success) {
            await this.recordRepository.markSent(record.id, result.messageId);
        }
        else {
            await this.recordRepository.markFailed(record.id, result.error ?? 'Unknown error', 1);
        }
        return result;
    }
    async dispatchMultiple(payloads) {
        this.logger.log(`[NotificationDispatchService] Dispatching ${payloads.length} notifications`);
        const results = await Promise.allSettled(payloads.map((payload) => this.dispatch(payload)));
        const deliveryResults = results.map((r, i) => {
            if (r.status === 'fulfilled')
                return r.value;
            const errorResult = {
                notificationId: `error-${i}`,
                channel: payloads[i].channel,
                success: false,
                error: r.reason.message,
            };
            return errorResult;
        });
        const failedChannels = deliveryResults
            .filter((r) => !r.success)
            .map((r) => r.channel);
        return {
            results: deliveryResults,
            allSuccessful: failedChannels.length === 0,
            failedChannels,
        };
    }
    async sendIncidentAlert(incidentId, severity, description) {
        const availableNotifiers = this.factory.getAvailableNotifiers();
        const payloads = availableNotifiers.map((notifier) => ({
            channel: notifier.getChannel(),
            recipient: this.getDefaultRecipient(notifier.getChannel()),
            subject: `[${severity}] Security Incident ${incidentId}`,
            body: `A ${severity} severity incident has been created.\n\nIncident ID: ${incidentId}\n\nDescription: ${description}`,
            metadata: { incidentId, severity },
            priority: severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        }));
        return this.dispatchMultiple(payloads);
    }
    getFactoryTier() {
        return this.factory.getTierName();
    }
    async getStats() {
        return this.recordRepository.countByStatus();
    }
    resolveNotifier(channel) {
        switch (channel) {
            case enums_1.NotificationChannel.EMAIL:
                return this.factory.createEmailNotifier();
            case enums_1.NotificationChannel.SLACK:
                return this.factory.createSlackNotifier();
            case enums_1.NotificationChannel.PAGERDUTY:
                return this.factory.createPagerDutyNotifier();
            default:
                throw new Error(`Unsupported notification channel: ${channel}`);
        }
    }
    getDefaultRecipient(channel) {
        switch (channel) {
            case enums_1.NotificationChannel.EMAIL:
                return process.env.SOC_EMAIL_RECIPIENT ?? 'soc@example.com';
            case enums_1.NotificationChannel.SLACK:
                return process.env.SLACK_DEFAULT_CHANNEL ?? '#soc-alerts';
            case enums_1.NotificationChannel.PAGERDUTY:
                return process.env.PAGERDUTY_SERVICE_KEY ?? '';
            default:
                return '';
        }
    }
};
exports.NotificationDispatchService = NotificationDispatchService;
exports.NotificationDispatchService = NotificationDispatchService = NotificationDispatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.NOTIFICATION_FACTORY)),
    __metadata("design:paramtypes", [Object, notification_record_repository_1.NotificationRecordRepository])
], NotificationDispatchService);
//# sourceMappingURL=notification-dispatch.service.js.map