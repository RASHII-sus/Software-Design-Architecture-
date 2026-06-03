// services/notification-service/tests/unit/notification.factory.spec.ts
// PATTERN: Abstract Factory — verify factory tier selection and product creation

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EnterpriseNotificationFactory } from '../../src/services/factory/enterprise-notification.factory';
import { BasicNotificationFactory } from '../../src/services/factory/basic-notification.factory';
import { EmailNotifier } from '../../src/services/channels/email.notifier';
import { SlackNotifier } from '../../src/services/channels/slack.notifier';
import { PagerDutyNotifier } from '../../src/services/channels/pagerduty.notifier';
import { NotificationChannel } from '../../../../shared/contracts/enums';

describe('Abstract Factory — NotificationFactory', () => {
  let emailNotifier: EmailNotifier;
  let slackNotifier: SlackNotifier;
  let pagerDutyNotifier: PagerDutyNotifier;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string, def?: unknown) => {
        const values: Record<string, unknown> = {
          SMTP_HOST: 'smtp.test.com',
          SMTP_USER: 'test@test.com',
          SLACK_BOT_TOKEN: 'xoxb-test',
          SLACK_DEFAULT_CHANNEL: '#test',
          PAGERDUTY_API_KEY: 'test-pd-key',
          PAGERDUTY_SERVICE_KEY: 'test-service-key',
        };
        return values[key] ?? def;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotifier,
        SlackNotifier,
        PagerDutyNotifier,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    emailNotifier = module.get<EmailNotifier>(EmailNotifier);
    slackNotifier = module.get<SlackNotifier>(SlackNotifier);
    pagerDutyNotifier = module.get<PagerDutyNotifier>(PagerDutyNotifier);
  });

  // ─── EnterpriseNotificationFactory ──────────────────────────────────────────
  describe('EnterpriseNotificationFactory', () => {
    let factory: EnterpriseNotificationFactory;

    beforeEach(() => {
      factory = new EnterpriseNotificationFactory(emailNotifier, slackNotifier, pagerDutyNotifier);
    });

    it('returns tier name ENTERPRISE', () => {
      expect(factory.getTierName()).toBe('ENTERPRISE');
    });

    it('createEmailNotifier returns EmailNotifier', () => {
      const notifier = factory.createEmailNotifier();
      expect(notifier.getChannel()).toBe(NotificationChannel.EMAIL);
    });

    it('createSlackNotifier returns SlackNotifier', () => {
      const notifier = factory.createSlackNotifier();
      expect(notifier.getChannel()).toBe(NotificationChannel.SLACK);
    });

    it('createPagerDutyNotifier returns PagerDutyNotifier', () => {
      const notifier = factory.createPagerDutyNotifier();
      expect(notifier.getChannel()).toBe(NotificationChannel.PAGERDUTY);
    });

    it('getAvailableNotifiers returns all three notifiers', () => {
      const notifiers = factory.getAvailableNotifiers();
      const channels = notifiers.map((n) => n.getChannel());
      expect(notifiers).toHaveLength(3);
      expect(channels).toContain(NotificationChannel.EMAIL);
      expect(channels).toContain(NotificationChannel.SLACK);
      expect(channels).toContain(NotificationChannel.PAGERDUTY);
    });
  });

  // ─── BasicNotificationFactory ────────────────────────────────────────────────
  describe('BasicNotificationFactory', () => {
    let factory: BasicNotificationFactory;

    beforeEach(() => {
      factory = new BasicNotificationFactory(emailNotifier);
    });

    it('returns tier name BASIC', () => {
      expect(factory.getTierName()).toBe('BASIC');
    });

    it('createEmailNotifier returns a working EmailNotifier', () => {
      const notifier = factory.createEmailNotifier();
      expect(notifier.getChannel()).toBe(NotificationChannel.EMAIL);
    });

    it('getAvailableNotifiers returns only email for BASIC tier', () => {
      const notifiers = factory.getAvailableNotifiers();
      expect(notifiers).toHaveLength(1);
      expect(notifiers[0].getChannel()).toBe(NotificationChannel.EMAIL);
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
        channel: NotificationChannel.SLACK,
        recipient: '#soc-alerts',
        body: 'Test message',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available in the Basic');
    });
  });

  // ─── Factory selection logic ──────────────────────────────────────────────────
  describe('Factory tier selection (useFactory)', () => {
    it('selects EnterpriseNotificationFactory when tier is ENTERPRISE', () => {
      const mockConfig = { get: jest.fn().mockReturnValue('ENTERPRISE') } as unknown as ConfigService;
      const enterprise = new EnterpriseNotificationFactory(emailNotifier, slackNotifier, pagerDutyNotifier);
      const basic = new BasicNotificationFactory(emailNotifier);

      const tier = mockConfig.get<string>('NOTIFICATION_TIER', 'BASIC')!.toUpperCase();
      const selected = tier === 'ENTERPRISE' ? enterprise : basic;
      expect(selected.getTierName()).toBe('ENTERPRISE');
    });

    it('falls back to BasicNotificationFactory when tier is unrecognized', () => {
      const mockConfig = { get: jest.fn().mockReturnValue('UNKNOWN') } as unknown as ConfigService;
      const enterprise = new EnterpriseNotificationFactory(emailNotifier, slackNotifier, pagerDutyNotifier);
      const basic = new BasicNotificationFactory(emailNotifier);

      const tier = mockConfig.get<string>('NOTIFICATION_TIER', 'BASIC')!.toUpperCase();
      const selected = tier === 'ENTERPRISE' ? enterprise : basic;
      expect(selected.getTierName()).toBe('BASIC');
    });
  });
});
