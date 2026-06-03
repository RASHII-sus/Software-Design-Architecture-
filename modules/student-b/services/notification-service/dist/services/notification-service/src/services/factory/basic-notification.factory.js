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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicNotificationFactory = void 0;
const common_1 = require("@nestjs/common");
const email_notifier_1 = require("../channels/email.notifier");
const enums_1 = require("../../../../../shared/contracts/enums");
const uuid_1 = require("uuid");
class UnavailableNotifier {
    constructor(channel) {
        this.channel = channel;
        this.logger = new common_1.Logger('UnavailableNotifier');
    }
    getChannel() { return this.channel; }
    isAvailable() { return false; }
    async send(payload) {
        this.logger.warn(`[BasicTier] ${this.channel} notifier is not available in the Basic tier. ` +
            `Upgrade to Enterprise to enable this channel.`);
        return {
            notificationId: (0, uuid_1.v4)(),
            channel: this.channel,
            success: false,
            error: `${this.channel} is not available in the Basic notification tier`,
        };
    }
}
let BasicNotificationFactory = class BasicNotificationFactory {
    constructor(emailNotifier) {
        this.emailNotifier = emailNotifier;
        this.slackStub = new UnavailableNotifier(enums_1.NotificationChannel.SLACK);
        this.pagerDutyStub = new UnavailableNotifier(enums_1.NotificationChannel.PAGERDUTY);
    }
    getTierName() { return 'BASIC'; }
    createEmailNotifier() { return this.emailNotifier; }
    createSlackNotifier() { return this.slackStub; }
    createPagerDutyNotifier() { return this.pagerDutyStub; }
    getAvailableNotifiers() {
        return [this.emailNotifier];
    }
};
exports.BasicNotificationFactory = BasicNotificationFactory;
exports.BasicNotificationFactory = BasicNotificationFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_notifier_1.EmailNotifier])
], BasicNotificationFactory);
//# sourceMappingURL=basic-notification.factory.js.map