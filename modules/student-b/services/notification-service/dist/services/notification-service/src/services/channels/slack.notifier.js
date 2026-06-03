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
var SlackNotifier_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackNotifier = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let SlackNotifier = SlackNotifier_1 = class SlackNotifier {
    constructor(httpService, config) {
        this.httpService = httpService;
        this.config = config;
        this.logger = new common_1.Logger(SlackNotifier_1.name);
        this.botToken = this.config.get('SLACK_BOT_TOKEN', '');
        this.defaultChannel = this.config.get('SLACK_DEFAULT_CHANNEL', '#soc-alerts');
    }
    getChannel() { return enums_1.NotificationChannel.SLACK; }
    isAvailable() { return Boolean(this.botToken); }
    async send(payload) {
        const notificationId = (0, uuid_1.v4)();
        const channel = payload.recipient || this.defaultChannel;
        this.logger.log(`[SlackNotifier] Posting to ${channel}`);
        try {
            if (!this.botToken) {
                await new Promise((r) => setTimeout(r, 20));
                return {
                    notificationId, channel: enums_1.NotificationChannel.SLACK, success: true,
                    messageId: `sim-${(0, uuid_1.v4)().slice(0, 8)}`, sentAt: new Date().toISOString(),
                };
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://slack.com/api/chat.postMessage', {
                channel,
                text: payload.subject ? `*${payload.subject}*\n${payload.body}` : payload.body,
                unfurl_links: false,
            }, { headers: { Authorization: `Bearer ${this.botToken}`, 'Content-Type': 'application/json' } }));
            const data = response.data;
            if (!data.ok)
                throw new Error(data.error ?? 'Slack API returned ok=false');
            this.logger.log(`[SlackNotifier] Sent — ts: ${data.ts}`);
            return {
                notificationId, channel: enums_1.NotificationChannel.SLACK, success: true,
                messageId: data.ts, sentAt: new Date().toISOString(),
            };
        }
        catch (err) {
            this.logger.error(`[SlackNotifier] Failed: ${err.message}`);
            return { notificationId, channel: enums_1.NotificationChannel.SLACK, success: false, error: err.message };
        }
    }
};
exports.SlackNotifier = SlackNotifier;
exports.SlackNotifier = SlackNotifier = SlackNotifier_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], SlackNotifier);
//# sourceMappingURL=slack.notifier.js.map