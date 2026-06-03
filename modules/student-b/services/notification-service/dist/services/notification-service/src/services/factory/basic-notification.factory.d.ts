import { NotificationFactory } from './notification.factory.interface';
import { Notifier } from '../channels/notifier.interface';
import { EmailNotifier } from '../channels/email.notifier';
export declare class BasicNotificationFactory implements NotificationFactory {
    private readonly emailNotifier;
    private readonly slackStub;
    private readonly pagerDutyStub;
    constructor(emailNotifier: EmailNotifier);
    getTierName(): string;
    createEmailNotifier(): Notifier;
    createSlackNotifier(): Notifier;
    createPagerDutyNotifier(): Notifier;
    getAvailableNotifiers(): Notifier[];
}
