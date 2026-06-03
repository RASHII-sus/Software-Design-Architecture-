import { NotificationFactory } from './notification.factory.interface';
import { Notifier } from '../channels/notifier.interface';
import { EmailNotifier } from '../channels/email.notifier';
import { SlackNotifier } from '../channels/slack.notifier';
import { PagerDutyNotifier } from '../channels/pagerduty.notifier';
export declare class EnterpriseNotificationFactory implements NotificationFactory {
    private readonly emailNotifier;
    private readonly slackNotifier;
    private readonly pagerDutyNotifier;
    constructor(emailNotifier: EmailNotifier, slackNotifier: SlackNotifier, pagerDutyNotifier: PagerDutyNotifier);
    getTierName(): string;
    createEmailNotifier(): Notifier;
    createSlackNotifier(): Notifier;
    createPagerDutyNotifier(): Notifier;
    getAvailableNotifiers(): Notifier[];
}
