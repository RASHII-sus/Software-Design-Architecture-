"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const notification_record_entity_1 = require("./domain/entities/notification-record.entity");
const notification_record_repository_1 = require("./domain/repositories/notification-record.repository");
const email_notifier_1 = require("./services/channels/email.notifier");
const slack_notifier_1 = require("./services/channels/slack.notifier");
const pagerduty_notifier_1 = require("./services/channels/pagerduty.notifier");
const enterprise_notification_factory_1 = require("./services/factory/enterprise-notification.factory");
const basic_notification_factory_1 = require("./services/factory/basic-notification.factory");
const notification_dispatch_service_1 = require("./services/notification-dispatch.service");
const notification_controller_1 = require("./controllers/notification.controller");
const notification_event_consumer_1 = require("./events/notification-event.consumer");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([notification_record_entity_1.NotificationRecordEntity]),
            config_1.ConfigModule,
            axios_1.HttpModule,
        ],
        controllers: [notification_controller_1.NotificationController],
        providers: [
            notification_record_repository_1.NotificationRecordRepository,
            email_notifier_1.EmailNotifier,
            slack_notifier_1.SlackNotifier,
            pagerduty_notifier_1.PagerDutyNotifier,
            enterprise_notification_factory_1.EnterpriseNotificationFactory,
            basic_notification_factory_1.BasicNotificationFactory,
            {
                provide: notification_dispatch_service_1.NOTIFICATION_FACTORY,
                inject: [config_1.ConfigService, enterprise_notification_factory_1.EnterpriseNotificationFactory, basic_notification_factory_1.BasicNotificationFactory],
                useFactory: (config, enterprise, basic) => {
                    const tier = config.get('NOTIFICATION_TIER', 'BASIC').toUpperCase();
                    const factory = tier === 'ENTERPRISE' ? enterprise : basic;
                    console.log(`[NotificationModule] Selected factory: ${factory.getTierName()}`);
                    return factory;
                },
            },
            notification_dispatch_service_1.NotificationDispatchService,
            notification_event_consumer_1.NotificationEventConsumer,
        ],
        exports: [notification_dispatch_service_1.NotificationDispatchService],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map