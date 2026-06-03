"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const notification_dispatch_service_1 = require("../../src/services/notification-dispatch.service");
const notification_record_repository_1 = require("../../src/domain/repositories/notification-record.repository");
const enums_1 = require("../../../../shared/contracts/enums");
describe('NotificationDispatchService', () => {
    let service;
    let mockFactory;
    let mockRepository;
    const makeNotifier = (channel, success) => ({
        send: jest.fn().mockResolvedValue({
            notificationId: 'n-id',
            channel,
            success,
            messageId: success ? 'msg-001' : undefined,
            error: success ? undefined : 'Connection refused',
            sentAt: success ? new Date().toISOString() : undefined,
        }),
        getChannel: jest.fn().mockReturnValue(channel),
        isAvailable: jest.fn().mockReturnValue(true),
    });
    beforeEach(async () => {
        mockFactory = {
            createEmailNotifier: jest.fn().mockReturnValue(makeNotifier(enums_1.NotificationChannel.EMAIL, true)),
            createSlackNotifier: jest.fn().mockReturnValue(makeNotifier(enums_1.NotificationChannel.SLACK, true)),
            createPagerDutyNotifier: jest.fn().mockReturnValue(makeNotifier(enums_1.NotificationChannel.PAGERDUTY, true)),
            getAvailableNotifiers: jest.fn().mockReturnValue([
                makeNotifier(enums_1.NotificationChannel.EMAIL, true),
                makeNotifier(enums_1.NotificationChannel.SLACK, true),
            ]),
            getTierName: jest.fn().mockReturnValue('ENTERPRISE'),
        };
        mockRepository = {
            create: jest.fn().mockResolvedValue({ id: 'record-001', status: enums_1.NotificationStatus.PENDING }),
            markSent: jest.fn().mockResolvedValue(undefined),
            markFailed: jest.fn().mockResolvedValue(undefined),
            countByStatus: jest.fn().mockResolvedValue({ SENT: 10, FAILED: 1 }),
            findByChannel: jest.fn().mockResolvedValue([]),
            findByStatus: jest.fn().mockResolvedValue([]),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                notification_dispatch_service_1.NotificationDispatchService,
                { provide: notification_dispatch_service_1.NOTIFICATION_FACTORY, useValue: mockFactory },
                { provide: notification_record_repository_1.NotificationRecordRepository, useValue: mockRepository },
            ],
        }).compile();
        service = module.get(notification_dispatch_service_1.NotificationDispatchService);
    });
    describe('dispatch', () => {
        const emailPayload = {
            channel: enums_1.NotificationChannel.EMAIL,
            recipient: 'analyst@company.com',
            subject: 'CRITICAL Alert',
            body: 'Malicious actor detected',
        };
        it('dispatches email notification via factory-created notifier', async () => {
            const result = await service.dispatch(emailPayload);
            expect(result.success).toBe(true);
            expect(result.channel).toBe(enums_1.NotificationChannel.EMAIL);
            expect(mockFactory.createEmailNotifier).toHaveBeenCalled();
        });
        it('persists record before sending', async () => {
            await service.dispatch(emailPayload);
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                channel: enums_1.NotificationChannel.EMAIL,
                recipient: emailPayload.recipient,
                status: enums_1.NotificationStatus.PENDING,
            }));
        });
        it('marks record as sent on success', async () => {
            await service.dispatch(emailPayload);
            expect(mockRepository.markSent).toHaveBeenCalledWith('record-001', 'msg-001');
        });
        it('marks record as failed on notifier failure', async () => {
            mockFactory.createEmailNotifier.mockReturnValue(makeNotifier(enums_1.NotificationChannel.EMAIL, false));
            await service.dispatch(emailPayload);
            expect(mockRepository.markFailed).toHaveBeenCalledWith('record-001', 'Connection refused', 1);
        });
        it('routes Slack channel to SlackNotifier via factory', async () => {
            await service.dispatch({ ...emailPayload, channel: enums_1.NotificationChannel.SLACK, recipient: '#alerts' });
            expect(mockFactory.createSlackNotifier).toHaveBeenCalled();
        });
        it('routes PagerDuty channel to PagerDutyNotifier via factory', async () => {
            await service.dispatch({ ...emailPayload, channel: enums_1.NotificationChannel.PAGERDUTY, recipient: 'pd-key' });
            expect(mockFactory.createPagerDutyNotifier).toHaveBeenCalled();
        });
    });
    describe('dispatchMultiple', () => {
        it('dispatches multiple payloads and returns aggregated results', async () => {
            const payloads = [
                { channel: enums_1.NotificationChannel.EMAIL, recipient: 'a@co.com', body: 'Email msg' },
                { channel: enums_1.NotificationChannel.SLACK, recipient: '#soc', body: 'Slack msg' },
            ];
            const result = await service.dispatchMultiple(payloads);
            expect(result.results).toHaveLength(2);
            expect(result.allSuccessful).toBe(true);
            expect(result.failedChannels).toHaveLength(0);
        });
        it('reports failedChannels when a notifier fails', async () => {
            mockFactory.createSlackNotifier.mockReturnValue(makeNotifier(enums_1.NotificationChannel.SLACK, false));
            const payloads = [
                { channel: enums_1.NotificationChannel.EMAIL, recipient: 'a@co.com', body: 'Email msg' },
                { channel: enums_1.NotificationChannel.SLACK, recipient: '#soc', body: 'Slack msg' },
            ];
            const result = await service.dispatchMultiple(payloads);
            expect(result.allSuccessful).toBe(false);
            expect(result.failedChannels).toContain(enums_1.NotificationChannel.SLACK);
        });
    });
    describe('sendIncidentAlert', () => {
        it('sends to all available notifiers returned by factory', async () => {
            const result = await service.sendIncidentAlert('INC-001', 'CRITICAL', 'Ransomware detected');
            expect(result.results).toHaveLength(2);
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
//# sourceMappingURL=notification-dispatch.service.spec.js.map