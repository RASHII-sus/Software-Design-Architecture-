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
var EmailNotifier_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotifier = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const enums_1 = require("../../../../../shared/contracts/enums");
let EmailNotifier = EmailNotifier_1 = class EmailNotifier {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(EmailNotifier_1.name);
        this.smtpHost = this.config.get('SMTP_HOST', '');
        this.smtpUser = this.config.get('SMTP_USER', '');
    }
    getChannel() { return enums_1.NotificationChannel.EMAIL; }
    isAvailable() { return Boolean(this.smtpHost && this.smtpUser); }
    async send(payload) {
        const notificationId = (0, uuid_1.v4)();
        this.logger.log(`[EmailNotifier] Sending to ${payload.recipient} — subject: ${payload.subject}`);
        try {
            await new Promise((r) => setTimeout(r, 30));
            const messageId = `<${(0, uuid_1.v4)()}@${this.smtpHost || 'sda-pro.local'}>`;
            this.logger.log(`[EmailNotifier] Sent — messageId: ${messageId}`);
            return {
                notificationId, channel: enums_1.NotificationChannel.EMAIL, success: true,
                messageId, sentAt: new Date().toISOString(),
            };
        }
        catch (err) {
            this.logger.error(`[EmailNotifier] Failed: ${err.message}`);
            return {
                notificationId, channel: enums_1.NotificationChannel.EMAIL, success: false,
                error: err.message,
            };
        }
    }
};
exports.EmailNotifier = EmailNotifier;
exports.EmailNotifier = EmailNotifier = EmailNotifier_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailNotifier);
//# sourceMappingURL=email.notifier.js.map