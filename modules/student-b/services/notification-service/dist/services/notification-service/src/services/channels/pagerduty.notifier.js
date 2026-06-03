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
var PagerDutyNotifier_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagerDutyNotifier = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let PagerDutyNotifier = PagerDutyNotifier_1 = class PagerDutyNotifier {
    constructor(httpService, config) {
        this.httpService = httpService;
        this.config = config;
        this.logger = new common_1.Logger(PagerDutyNotifier_1.name);
        this.apiKey = this.config.get('PAGERDUTY_API_KEY', '');
        this.serviceKey = this.config.get('PAGERDUTY_SERVICE_KEY', '');
    }
    getChannel() { return enums_1.NotificationChannel.PAGERDUTY; }
    isAvailable() { return Boolean(this.apiKey && this.serviceKey); }
    async send(payload) {
        const notificationId = (0, uuid_1.v4)();
        const dedupKey = `sda-pro-${(0, uuid_1.v4)().slice(0, 8)}`;
        this.logger.log(`[PagerDutyNotifier] Creating incident for ${payload.recipient}`);
        try {
            if (!this.serviceKey) {
                await new Promise((r) => setTimeout(r, 25));
                return {
                    notificationId, channel: enums_1.NotificationChannel.PAGERDUTY, success: true,
                    messageId: `pd-sim-${dedupKey}`, sentAt: new Date().toISOString(),
                };
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://events.pagerduty.com/v2/enqueue', {
                routing_key: this.serviceKey,
                event_action: 'trigger',
                dedup_key: dedupKey,
                payload: {
                    summary: payload.subject ?? payload.body.slice(0, 100),
                    source: 'SDA-Pro',
                    severity: payload.priority === 'HIGH' ? 'critical' : 'warning',
                    custom_details: { body: payload.body, metadata: payload.metadata },
                },
            }, { headers: { 'Content-Type': 'application/json' } }));
            const data = response.data;
            this.logger.log(`[PagerDutyNotifier] Incident created — dedup_key: ${data.dedup_key}`);
            return {
                notificationId, channel: enums_1.NotificationChannel.PAGERDUTY, success: true,
                messageId: data.dedup_key, sentAt: new Date().toISOString(),
            };
        }
        catch (err) {
            this.logger.error(`[PagerDutyNotifier] Failed: ${err.message}`);
            return { notificationId, channel: enums_1.NotificationChannel.PAGERDUTY, success: false, error: err.message };
        }
    }
};
exports.PagerDutyNotifier = PagerDutyNotifier;
exports.PagerDutyNotifier = PagerDutyNotifier = PagerDutyNotifier_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], PagerDutyNotifier);
//# sourceMappingURL=pagerduty.notifier.js.map