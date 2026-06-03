"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const enterprise_notification_factory_1 = require("../../src/services/factory/enterprise-notification.factory");
const basic_notification_factory_1 = require("../../src/services/factory/basic-notification.factory");
const email_notifier_1 = require("../../src/services/channels/email.notifier");
const slack_notifier_1 = require("../../src/services/channels/slack.notifier");
const pagerduty_notifier_1 = require("../../src/services/channels/pagerduty.notifier");
const enums_1 = require("../../../../shared/contracts/enums");
describe('Abstract Factory — NotificationFactory', () => {
    let emailNotifier;
    let slackNotifier;
    let pagerDutyNotifier;
    let configService;
    let httpService;
    beforeEach(async () => {
        configService = {
            get: jest.fn((key, def) => {
                const values = {
                    SMTP_HOST: 'smtp.test.com',
                    SMTP_USER: 'test@test.com',
                    SLACK_BOT_TOKEN: 'xoxb-test',
                    SLACK_DEFAULT_CHANNEL: '#test',
                    PAGERDUTY_API_KEY: 'test-pd-key',
                    PAGERDUTY_SERVICE_KEY: 'test-service-key',
                };
                return values[key] ?? def;
            }),
        };
        httpService = {
            post: jest.fn(),
            get: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                email_notifier_1.EmailNotifier,
                slack_notifier_1.SlackNotifier,
                pagerduty_notifier_1.PagerDutyNotifier,
                { provide: config_1.ConfigService, useValue: configService },
                { provide: axios_1.HttpService, useValue: httpService },
            ],
        }).compile();
        emailNotifier = module.get(email_notifier_1.EmailNotifier);
        slackNotifier = module.get(slack_notifier_1.SlackNotifier);
        pagerDutyNotifier = module.get(pagerduty_notifier_1.PagerDutyNotifier);
    });
    describe('EnterpriseNotificationFactory', () => {
        let factory;
        beforeEach(() => {
            factory = new enterprise_notification_factory_1.EnterpriseNotificationFactory(emailNotifier, slackNotifier, pagerDutyNotifier);
        });
        it('returns tier name ENTERPRISE', () => {
            expect(factory.getTierName()).toBe('ENTERPRISE');
        });
        it('createEmailNotifier returns EmailNotifier', () => {
            const notifier = factory.createEmailNotifier();
            expect(notifier.getChannel()).toBe(enums_1.NotificationChannel.EMAIL);
        });
        it('createSlackNotifier returns SlackNotifier', () => {
            const notifier = factory.createSlackNotifier();
            expect(notifier.getChannel()).toBe(enums_1.NotificationChannel.SLACK);
        });
        it('createPagerDutyNotifier returns PagerDutyNotifier', () => {
            const notifier = factory.createPagerDutyNotifier();
            expect(notifier.getChannel()).toBe(enums_1.NotificationChannel.PAGERDUTY);
        });
        it('getAvailableNotifiers returns all three notifiers', () => {
            const notifiers = factory.getAvailableNotifiers();
            const channels = notifiers.map((n) => n.getChannel());
            expect(notifiers).toHaveLength(3);
            expect(channels).toContain(enums_1.NotificationChannel.EMAIL);
            expect(channels).toContain(enums_1.NotificationChannel.SLACK);
            expect(channels).toContain(enums_1.NotificationChannel.PAGERDUTY);
        });
    });
    describe('BasicNotificationFactory', () => {
        let factory;
        beforeEach(() => {
            factory = new basic_notification_factory_1.BasicNotificationFactory(emailNotifier);
        });
        it('returns tier name BASIC', () => {
            expect(factory.getTierName()).toBe('BASIC');
        });
        it('createEmailNotifier returns a working EmailNotifier', () => {
            const notifier = factory.createEmailNotifier();
            expect(notifier.getChannel()).toBe(enums_1.NotificationChannel.EMAIL);
        });
        it('getAvailableNotifiers returns only email for BASIC tier', () => {
            const notifiers = factory.getAvailableNotifiers();
            expect(notifiers).toHaveLength(1);
            expect(notifiers[0].getChannel()).toBe(enums_1.NotificationChannel.EMAIL);
        });
        it('createSlackNotifier returns unavailable stub', () => {
            const notifier = factory.createSlackNotifier();
            expect(notifier.isAvailable()).toBe(false);
        });
        it('createPagerDutyNotifier returns unavailable stub', () => {
            const notifier = factory.createPagerDutyNotifier();
            expect(notifier.isAvailable()).toBe(false);
        });
        it('stub notifier.send() returns failure with descriptive error', async () => {
            const notifier = factory.createSlackNotifier();
            const result = await notifier.send({
                channel: enums_1.NotificationChannel.SLACK,
                recipient: '#soc-alerts',
                body: 'Test message',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not available in the Basic');
        });
    });
    describe('Factory tier selection (useFactory)', () => {
        it('selects EnterpriseNotificationFactory when tier is ENTERPRISE', () => {
            const mockConfig = { get: jest.fn().mockReturnValue('ENTERPRISE') };
            const enterprise = new enterprise_notification_factory_1.EnterpriseNotificationFactory(emailNotifier, slackNotifier, pagerDutyNotifier);
            const basic = new basic_notification_factory_1.BasicNotificationFactory(emailNotifier);
            const tier = mockConfig.get('NOTIFICATION_TIER', 'BASIC').toUpperCase();
            const selected = tier === 'ENTERPRISE' ? enterprise : basic;
            expect(selected.getTierName()).toBe('ENTERPRISE');
        });
        it('falls back to BasicNotificationFactory when tier is unrecognized', () => {
            const mockConfig = { get: jest.fn().mockReturnValue('UNKNOWN') };
            const enterprise = new enterprise_notification_factory_1.EnterpriseNotificationFactory(emailNotifier, slackNotifier, pagerDutyNotifier);
            const basic = new basic_notification_factory_1.BasicNotificationFactory(emailNotifier);
            const tier = mockConfig.get('NOTIFICATION_TIER', 'BASIC').toUpperCase();
            const selected = tier === 'ENTERPRISE' ? enterprise : basic;
            expect(selected.getTierName()).toBe('BASIC');
        });
    });
});
//# sourceMappingURL=notification.factory.spec.js.map