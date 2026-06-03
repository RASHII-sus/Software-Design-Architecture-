// services/notification-service/tests/unit/notification-dispatch.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationDispatchService,
  NOTIFICATION_FACTORY,
} from '../../src/services/notification-dispatch.service';
import { NotificationRecordRepository } from '../../src/domain/repositories/notification-record.repository';
import { NotificationFactory } from '../../src/services/factory/notification.factory.interface';
import { Notifier } from '../../src/services/channels/notifier.interface';
import { NotificationChannel, NotificationStatus } from '../../../../shared/contracts/enums';
import { NotificationPayload, DeliveryResult } from '../../../../shared/contracts/interfaces';

describe('NotificationDispatchService', () => {
  let service: NotificationDispatchService;
  let mockFactory: jest.Mocked<NotificationFactory>;
  let mockRepository: jest.Mocked<NotificationRecordRepository>;

  const makeNotifier = (
    channel: NotificationChannel,
    success: boolean,
  ): jest.Mocked<Notifier> => ({
    send: jest.fn().mockResolvedValue({
      notificationId: 'n-id',
      channel,
      success,
      messageId: success ? 'msg-001' : undefined,
      error: success ? undefined : 'Connection refused',
      sentAt: success ? new Date().toISOString() : undefined,
    } as DeliveryResult),
    getChannel: jest.fn().mockReturnValue(channel),
    isAvailable: jest.fn().mockReturnValue(true),
  });

  beforeEach(async () => {
    mockFactory = {
      createEmailNotifier: jest.fn().mockReturnValue(makeNotifier(NotificationChannel.EMAIL, true)),
      createSlackNotifier: jest.fn().mockReturnValue(makeNotifier(NotificationChannel.SLACK, true)),
      createPagerDutyNotifier: jest.fn().mockReturnValue(makeNotifier(NotificationChannel.PAGERDUTY, true)),
      getAvailableNotifiers: jest.fn().mockReturnValue([
        makeNotifier(NotificationChannel.EMAIL, true),
        makeNotifier(NotificationChannel.SLACK, true),
      ]),
      getTierName: jest.fn().mockReturnValue('ENTERPRISE'),
    };

    mockRepository = {
      create: jest.fn().mockResolvedValue({ id: 'record-001', status: NotificationStatus.PENDING }),
      markSent: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      countByStatus: jest.fn().mockResolvedValue({ SENT: 10, FAILED: 1 }),
      findByChannel: jest.fn().mockResolvedValue([]),
      findByStatus: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<NotificationRecordRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDispatchService,
        { provide: NOTIFICATION_FACTORY, useValue: mockFactory },
        { provide: NotificationRecordRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<NotificationDispatchService>(NotificationDispatchService);
  });

  describe('dispatch', () => {
    const emailPayload: NotificationPayload = {
      channel: NotificationChannel.EMAIL,
      recipient: 'analyst@company.com',
      subject: 'CRITICAL Alert',
      body: 'Malicious actor detected',
    };

    it('dispatches email notification via factory-created notifier', async () => {
      const result = await service.dispatch(emailPayload);
      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
      expect(mockFactory.createEmailNotifier).toHaveBeenCalled();
    });

    it('persists record before sending', async () => {
      await service.dispatch(emailPayload);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: NotificationChannel.EMAIL,
          recipient: emailPayload.recipient,
          status: NotificationStatus.PENDING,
        }),
      );
    });

    it('marks record as sent on success', async () => {
      await service.dispatch(emailPayload);
      expect(mockRepository.markSent).toHaveBeenCalledWith('record-001', 'msg-001');
    });

    it('marks record as failed on notifier failure', async () => {
      mockFactory.createEmailNotifier.mockReturnValue(
        makeNotifier(NotificationChannel.EMAIL, false),
      );
      await service.dispatch(emailPayload);
      expect(mockRepository.markFailed).toHaveBeenCalledWith(
        'record-001',
        'Connection refused',
        1,
      );
    });

    it('routes Slack channel to SlackNotifier via factory', async () => {
      await service.dispatch({ ...emailPayload, channel: NotificationChannel.SLACK, recipient: '#alerts' });
      expect(mockFactory.createSlackNotifier).toHaveBeenCalled();
    });

    it('routes PagerDuty channel to PagerDutyNotifier via factory', async () => {
      await service.dispatch({ ...emailPayload, channel: NotificationChannel.PAGERDUTY, recipient: 'pd-key' });
      expect(mockFactory.createPagerDutyNotifier).toHaveBeenCalled();
    });
  });

  describe('dispatchMultiple', () => {
    it('dispatches multiple payloads and returns aggregated results', async () => {
      const payloads: NotificationPayload[] = [
        { channel: NotificationChannel.EMAIL, recipient: 'a@co.com', body: 'Email msg' },
        { channel: NotificationChannel.SLACK, recipient: '#soc', body: 'Slack msg' },
      ];
      const result = await service.dispatchMultiple(payloads);
      expect(result.results).toHaveLength(2);
      expect(result.allSuccessful).toBe(true);
      expect(result.failedChannels).toHaveLength(0);
    });

    it('reports failedChannels when a notifier fails', async () => {
      mockFactory.createSlackNotifier.mockReturnValue(
        makeNotifier(NotificationChannel.SLACK, false),
      );
      const payloads: NotificationPayload[] = [
        { channel: NotificationChannel.EMAIL, recipient: 'a@co.com', body: 'Email msg' },
        { channel: NotificationChannel.SLACK, recipient: '#soc', body: 'Slack msg' },
      ];
      const result = await service.dispatchMultiple(payloads);
      expect(result.allSuccessful).toBe(false);
      expect(result.failedChannels).toContain(NotificationChannel.SLACK);
    });
  });

  describe('sendIncidentAlert', () => {
    it('sends to all available notifiers returned by factory', async () => {
      const result = await service.sendIncidentAlert('INC-001', 'CRITICAL', 'Ransomware detected');
      expect(result.results).toHaveLength(2); // factory returns email + slack
      expect(mockFactory.getAvailableNotifiers).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns notification count by status', async () => {
      const stats = await service.getStats();
      expect(stats).toEqual({ SENT: 10, FAILED: 1 });
    });
  });
});
