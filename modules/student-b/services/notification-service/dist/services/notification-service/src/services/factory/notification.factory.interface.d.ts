import { Notifier } from '../channels/notifier.interface';
export interface NotificationFactory {
    createEmailNotifier(): Notifier;
    createSlackNotifier(): Notifier;
    createPagerDutyNotifier(): Notifier;
    getAvailableNotifiers(): Notifier[];
    getTierName(): string;
}
